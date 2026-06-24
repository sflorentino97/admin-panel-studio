-- Auto 48h deadline: when a request enters 'active' category,
-- due_date is set to now + 48h. Once set, it cannot be changed.
-- Also handles started_at, completed_at, and 1-active-per-client rule
-- using the new status_id + request_statuses system.

CREATE OR REPLACE FUNCTION handle_status_change() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_new_cat text;
  v_old_cat text;
BEGIN
  -- Lock due_date: if already set (task was activated), revert manual changes
  IF OLD.started_at IS NOT NULL AND OLD.due_date IS NOT NULL
     AND NEW.due_date IS DISTINCT FROM OLD.due_date
     AND NEW.status_id IS NOT DISTINCT FROM OLD.status_id THEN
    NEW.due_date := OLD.due_date;
  END IF;

  -- Handle status transitions
  IF NEW.status_id IS DISTINCT FROM OLD.status_id THEN
    SELECT category INTO v_new_cat FROM request_statuses WHERE id = NEW.status_id;
    SELECT category INTO v_old_cat FROM request_statuses WHERE id = OLD.status_id;

    -- Entering active: enforce 1-at-a-time, set started_at + 48h deadline
    IF v_new_cat = 'active' THEN
      IF EXISTS (
        SELECT 1 FROM requests r
        JOIN request_statuses rs ON rs.id = r.status_id
        WHERE r.client_id = NEW.client_id
          AND rs.category = 'active'
          AND r.id <> NEW.id
      ) THEN
        RAISE EXCEPTION 'Este cliente já tem um pedido em andamento';
      END IF;

      -- Only set timestamps on first activation
      IF NEW.started_at IS NULL THEN
        NEW.started_at := now();
        NEW.due_date := (now() + interval '48 hours')::date;
      END IF;
    END IF;

    -- Entering done: stamp completed_at
    IF v_new_cat = 'done' AND NEW.completed_at IS NULL THEN
      NEW.completed_at := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
