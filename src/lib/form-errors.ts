import type {
  FieldPath,
  FieldValues,
  Path,
  UseFormReturn,
} from "react-hook-form";

interface ApiValidationDetail {
  path?: string[];
  message?: string;
}

export function applyApiValidationDetails<T extends FieldValues>(
  form: Pick<UseFormReturn<T>, "setError">,
  details?: ApiValidationDetail[] | null
) {
  const fields: Array<Path<T>> = [];

  for (const detail of details ?? []) {
    const field = detail.path?.[0];
    if (!field || !detail.message) continue;

    form.setError(field as FieldPath<T>, {
      type: "server",
      message: detail.message,
    });
    fields.push(field as Path<T>);
  }

  return fields;
}
