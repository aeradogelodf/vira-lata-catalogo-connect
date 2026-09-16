CREATE TABLE public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_internal_code text NOT NULL,
  movement_type text NOT NULL CHECK (movement_type IN ('entry', 'exit', 'adjustment', 'inventory')),
  quantity integer NOT NULL,
  previous_stock integer NOT NULL CHECK (previous_stock >= 0),
  current_stock integer NOT NULL CHECK (current_stock >= 0),
  reason text,
  performed_by uuid,
  performed_by_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.inventory_movements TO authenticated;
GRANT ALL ON public.inventory_movements TO service_role;

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins leem movimentacoes de estoque"
ON public.inventory_movements FOR SELECT TO authenticated
USING (public.is_admin());

CREATE INDEX idx_inventory_movements_product_created
ON public.inventory_movements (product_id, created_at DESC);

CREATE INDEX idx_inventory_movements_type_created
ON public.inventory_movements (movement_type, created_at DESC);

CREATE OR REPLACE FUNCTION public.apply_inventory_movement(
  p_product_id uuid,
  p_movement_type text,
  p_quantity integer,
  p_reason text DEFAULT NULL,
  p_expected_updated_at timestamptz DEFAULT NULL
)
RETURNS public.inventory_movements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product public.products%ROWTYPE;
  v_previous_stock integer;
  v_current_stock integer;
  v_delta integer;
  v_email text;
  v_movement public.inventory_movements%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso restrito a administradores.' USING ERRCODE = '42501';
  END IF;

  IF p_movement_type NOT IN ('entry', 'exit', 'adjustment', 'inventory') THEN
    RAISE EXCEPTION 'Tipo de movimentação inválido.' USING ERRCODE = '22023';
  END IF;

  IF p_quantity < 0 THEN
    RAISE EXCEPTION 'A quantidade não pode ser negativa.' USING ERRCODE = '22023';
  END IF;

  IF p_movement_type IN ('entry', 'exit') AND p_quantity = 0 THEN
    RAISE EXCEPTION 'A quantidade deve ser maior que zero.' USING ERRCODE = '22023';
  END IF;

  IF p_movement_type = 'adjustment' AND nullif(btrim(coalesce(p_reason, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Informe o motivo do ajuste.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_product
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto não encontrado.' USING ERRCODE = 'P0002';
  END IF;

  IF p_expected_updated_at IS NOT NULL AND v_product.updated_at <> p_expected_updated_at THEN
    RAISE EXCEPTION 'Este produto foi alterado por outro administrador. Recarregue antes de continuar.' USING ERRCODE = '40001';
  END IF;

  v_previous_stock := v_product.stock;

  IF p_movement_type = 'entry' THEN
    v_current_stock := v_previous_stock + p_quantity;
  ELSIF p_movement_type = 'exit' THEN
    v_current_stock := v_previous_stock - p_quantity;
  ELSE
    v_current_stock := p_quantity;
  END IF;

  IF v_current_stock < 0 THEN
    RAISE EXCEPTION 'Estoque insuficiente. O saldo não pode ficar negativo.' USING ERRCODE = '22023';
  END IF;

  v_delta := v_current_stock - v_previous_stock;
  v_email := nullif(auth.jwt() ->> 'email', '');

  PERFORM set_config('app.inventory_movement_logged', 'true', true);

  UPDATE public.products
  SET stock = v_current_stock
  WHERE id = p_product_id;

  INSERT INTO public.inventory_movements (
    product_id,
    product_name,
    product_internal_code,
    movement_type,
    quantity,
    previous_stock,
    current_stock,
    reason,
    performed_by,
    performed_by_email
  ) VALUES (
    v_product.id,
    v_product.name,
    v_product.internal_code,
    p_movement_type,
    v_delta,
    v_previous_stock,
    v_current_stock,
    nullif(btrim(coalesce(p_reason, '')), ''),
    auth.uid(),
    v_email
  )
  RETURNING * INTO v_movement;

  RETURN v_movement;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_inventory_movement(uuid, text, integer, text, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_inventory_movement(uuid, text, integer, text, timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.apply_inventory_movement(uuid, text, integer, text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_inventory_movement(uuid, text, integer, text, timestamptz) TO service_role;

CREATE OR REPLACE FUNCTION public.log_direct_product_stock_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_previous integer;
  v_email text;
BEGIN
  IF current_setting('app.inventory_movement_logged', true) = 'true' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_previous := 0;
    IF NEW.stock = 0 THEN
      RETURN NEW;
    END IF;
  ELSE
    v_previous := OLD.stock;
    IF NEW.stock IS NOT DISTINCT FROM OLD.stock THEN
      RETURN NEW;
    END IF;
  END IF;

  v_email := nullif(auth.jwt() ->> 'email', '');

  INSERT INTO public.inventory_movements (
    product_id,
    product_name,
    product_internal_code,
    movement_type,
    quantity,
    previous_stock,
    current_stock,
    reason,
    performed_by,
    performed_by_email
  ) VALUES (
    NEW.id,
    NEW.name,
    NEW.internal_code,
    'adjustment',
    NEW.stock - v_previous,
    v_previous,
    NEW.stock,
    CASE WHEN TG_OP = 'INSERT' THEN 'Estoque inicial informado no cadastro do produto' ELSE 'Alteração realizada no cadastro do produto' END,
    auth.uid(),
    v_email
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.log_direct_product_stock_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_direct_product_stock_change() FROM anon;
REVOKE ALL ON FUNCTION public.log_direct_product_stock_change() FROM authenticated;

CREATE TRIGGER products_log_stock_change
AFTER INSERT OR UPDATE OF stock ON public.products
FOR EACH ROW EXECUTE FUNCTION public.log_direct_product_stock_change();