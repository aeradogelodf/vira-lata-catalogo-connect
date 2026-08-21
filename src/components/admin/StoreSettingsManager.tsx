import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useForm, useFieldArray, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { storeQueries } from "@/lib/store-queries";
import {
  FALLBACK_STORE,
  storeSettingsSchema,
  toFormValues,
  type StoreSettingsParsed,
} from "@/lib/store-settings";
import { saveStoreSettings } from "@/lib/store.functions";

type Form = UseFormReturn<StoreSettingsParsed, unknown, StoreSettingsParsed>;

function Field({
  form,
  name,
  label,
  placeholder,
  type = "text",
}: {
  form: Form;
  name: keyof StoreSettingsParsed & string;
  label: string;
  placeholder?: string;
  type?: string;
}) {
  const error = form.formState.errors[name]?.message as string | undefined;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} type={type} placeholder={placeholder} {...form.register(name)} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Area({
  form,
  name,
  label,
  rows = 3,
}: {
  form: Form;
  name: keyof StoreSettingsParsed & string;
  label: string;
  rows?: number;
}) {
  const error = form.formState.errors[name]?.message as string | undefined;
  return (
    <div className="space-y-1.5 sm:col-span-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} rows={rows} {...form.register(name)} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-card p-5 sm:p-6">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function StoreSettingsManager() {
  const queryClient = useQueryClient();
  const { data: store, isLoading } = useQuery(storeQueries.settings());
  const save = useServerFn(saveStoreSettings);

  const form = useForm<StoreSettingsParsed, unknown, StoreSettingsParsed>({
    resolver: zodResolver(storeSettingsSchema) as never,
    defaultValues: toFormValues(store ?? FALLBACK_STORE),
  });

  const hours = useFieldArray({ control: form.control, name: "openingHours" });

  useEffect(() => {
    if (store) form.reset(toFormValues(store));
  }, [store]);

  const mutation = useMutation({
    mutationFn: (values: StoreSettingsParsed) => save({ data: values }),
    onSuccess: async () => {
      toast.success("Configurações salvas.");
      await queryClient.invalidateQueries({ queryKey: ["store", "settings"] });
    },
    onError: (error: Error) =>
      toast.error(error.message || "Não foi possível salvar as configurações."),
  });

  if (isLoading || !store) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  return (
    <form onSubmit={onSubmit} className="space-y-5 pb-24">
      <header>
        <h1 className="font-display text-2xl font-bold">Configurações da loja</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Estas informações alimentam o catálogo público: home, contato, rodapé, WhatsApp e SEO.
        </p>
      </header>

      <Section title="Identidade" description="Como a loja é apresentada no catálogo.">
        <Field form={form} name="name" label="Nome da loja" />
        <Field form={form} name="tradeName" label="Nome comercial" />
        <Field form={form} name="segment" label="Segmento" />
        <Field form={form} name="shortDescription" label="Descrição curta" />
        <Area form={form} name="longDescription" label="Descrição institucional" rows={4} />
      </Section>

      <Section title="Contato" description="Canais de atendimento exibidos ao público.">
        <Field form={form} name="whatsapp" label="WhatsApp (somente números, com DDI/DDD)" placeholder="556133997123" />
        <Field form={form} name="whatsappDisplay" label="WhatsApp exibido" placeholder="(61) 3399-7123" />
        <Field form={form} name="phone" label="Telefone" />
        <Field form={form} name="email" label="E-mail" type="email" />
      </Section>

      <Section title="Endereço" description="Usado no rodapé, na página de contato e no SEO local.">
        <Field form={form} name="street" label="Endereço" />
        <Field form={form} name="number" label="Número" />
        <Field form={form} name="complement" label="Complemento" />
        <Field form={form} name="district" label="Bairro" />
        <Field form={form} name="city" label="Cidade" />
        <Field form={form} name="state" label="Estado (UF)" placeholder="DF" />
        <Field form={form} name="postalCode" label="CEP" placeholder="00000-000" />
        <Field form={form} name="country" label="País (sigla)" placeholder="BR" />
      </Section>

      <section className="surface-card p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold">Horários</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Marque "Fechado" nos dias sem atendimento.
        </p>
        <div className="mt-4 space-y-3">
          {hours.fields.map((field, index) => {
            const closed = form.watch(`openingHours.${index}.closed`);
            const errors = form.formState.errors.openingHours?.[index];
            return (
              <div
                key={field.id}
                className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
              >
                <p className="font-medium">{field.label}</p>
                <div className="space-y-1.5">
                  <Label htmlFor={`open-${index}`} className="text-xs">
                    Abre
                  </Label>
                  <Input
                    id={`open-${index}`}
                    type="time"
                    disabled={closed}
                    {...form.register(`openingHours.${index}.opensAt`)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`close-${index}`} className="text-xs">
                    Fecha
                  </Label>
                  <Input
                    id={`close-${index}`}
                    type="time"
                    disabled={closed}
                    {...form.register(`openingHours.${index}.closesAt`)}
                  />
                </div>
                <div className="flex items-center gap-2 sm:pb-2">
                  <Switch
                    id={`closed-${index}`}
                    checked={closed}
                    onCheckedChange={(value) =>
                      form.setValue(`openingHours.${index}.closed`, value, { shouldDirty: true })
                    }
                  />
                  <Label htmlFor={`closed-${index}`}>Fechado</Label>
                </div>
                {(errors?.opensAt || errors?.closesAt) && (
                  <p className="text-xs text-destructive sm:col-span-4">
                    {errors?.opensAt?.message ?? errors?.closesAt?.message}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <Section title="Redes sociais" description="Opcional. Informe a URL completa.">
        <Field form={form} name="instagramUrl" label="Instagram" placeholder="https://instagram.com/..." />
        <Field form={form} name="facebookUrl" label="Facebook" placeholder="https://facebook.com/..." />
        <Field form={form} name="tiktokUrl" label="TikTok" placeholder="https://tiktok.com/@..." />
        <Field form={form} name="websiteUrl" label="Site" placeholder="https://..." />
        <Field form={form} name="otherSocialUrl" label="Outro link" placeholder="https://..." />
      </Section>

      <section className="surface-card p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold">Catálogo</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Comportamento do catálogo público.
        </p>
        <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-border p-3">
          <div>
            <Label htmlFor="hideOutOfStock">Ocultar produtos sem estoque</Label>
            <p className="text-xs text-muted-foreground">
              Quando desligado, produtos sem estoque aparecem marcados como indisponíveis.
            </p>
          </div>
          <Switch
            id="hideOutOfStock"
            checked={form.watch("hideOutOfStock")}
            onCheckedChange={(value) =>
              form.setValue("hideOutOfStock", value, { shouldDirty: true })
            }
          />
        </div>
      </section>

      <div className="sticky bottom-16 z-10 flex flex-wrap justify-end gap-2 rounded-xl border border-border bg-background/95 p-3 backdrop-blur sm:bottom-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => form.reset(toFormValues(store))}
          disabled={mutation.isPending || !form.formState.isDirty}
        >
          <RotateCcw /> Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="animate-spin" /> : <Save />} Salvar alterações
        </Button>
      </div>
    </form>
  );
}
