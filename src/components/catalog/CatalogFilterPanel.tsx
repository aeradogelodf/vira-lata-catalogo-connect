import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { CatalogState } from "@/lib/catalog";
import type { Brand, Category } from "@/types/catalog";

export function CatalogFilterPanel({
  state,
  onChange,
  categories,
  brands,
  hasPrices,
  hasPromotions,
}: {
  state: CatalogState;
  onChange: (patch: Partial<CatalogState>) => void;
  categories: Category[];
  brands: Brand[];
  hasPrices: boolean;
  hasPromotions: boolean;
}) {
  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="font-display text-sm font-bold">Categoria</legend>
        {categories.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nenhuma categoria cadastrada.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {categories.map((category) => {
              const active = state.categorySlug === category.slug;
              return (
                <li key={category.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => onChange({ categorySlug: active ? null : category.slug })}
                    className={`w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-secondary ${
                      active ? "bg-secondary font-semibold text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {category.name}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </fieldset>

      <fieldset>
        <legend className="font-display text-sm font-bold">Marca</legend>
        {brands.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nenhuma marca cadastrada.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {brands.map((brand) => {
              const active = state.brandSlug === brand.slug;
              return (
                <li key={brand.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => onChange({ brandSlug: active ? null : brand.slug })}
                    className={`w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-secondary ${
                      active ? "bg-secondary font-semibold text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {brand.name}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-display text-sm font-bold">Disponibilidade</legend>
        <div className="flex items-center gap-2">
          <Checkbox
            id="filtro-disponivel"
            checked={state.onlyAvailable}
            onCheckedChange={(checked) => onChange({ onlyAvailable: checked === true })}
          />
          <Label htmlFor="filtro-disponivel" className="text-sm font-normal">
            Somente disponíveis
          </Label>
        </div>
        {hasPromotions && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="filtro-promo"
              checked={state.onlyPromotions}
              onCheckedChange={(checked) => onChange({ onlyPromotions: checked === true })}
            />
            <Label htmlFor="filtro-promo" className="text-sm font-normal">
              Somente promoções
            </Label>
          </div>
        )}
      </fieldset>

      {!hasPrices && (
        <p className="text-xs text-muted-foreground">
          Filtro por faixa de preço fica disponível quando houver produtos com preço cadastrado.
        </p>
      )}
    </div>
  );
}