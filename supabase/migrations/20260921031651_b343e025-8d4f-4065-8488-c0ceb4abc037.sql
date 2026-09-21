CREATE OR REPLACE FUNCTION public.apply_inventory_movement(p_product_id uuid, p_movement_type text, p_quantity integer, p_reason text DEFAULT NULL::text, p_expected_updated_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
RETURNS public.inventory_movements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  IF p_expected_updated_at IS NOT NULL
     AND date_trunc('milliseconds', v_product.updated_at) <> date_trunc('milliseconds', p_expected_updated_at) THEN
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
    product_id, product_name, product_internal_code, movement_type, quantity,
    previous_stock, current_stock, reason, performed_by, performed_by_email
  ) VALUES (
    v_product.id, v_product.name, v_product.internal_code, p_movement_type, v_delta,
    v_previous_stock, v_current_stock, nullif(btrim(coalesce(p_reason, '')), ''), auth.uid(), v_email
  )
  RETURNING * INTO v_movement;

  RETURN v_movement;
END;
$function$;

REVOKE ALL ON FUNCTION public.apply_inventory_movement(uuid, text, integer, text, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_inventory_movement(uuid, text, integer, text, timestamptz) FROM anon;
REVOKE ALL ON FUNCTION public.apply_inventory_movement(uuid, text, integer, text, timestamptz) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.apply_inventory_movement(uuid, text, integer, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_inventory_movement(uuid, text, integer, text, timestamptz) TO sandbox_exec;