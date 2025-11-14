import { ChangeEvent } from "react";
import { useStepperForm } from "./context";
import { FormField } from "./form-field";

export function CustomInput({
  tabIndex,
  fieldName,
  label,
  type = "text",
  placeholder = "",
  ...rest
}: {
  tabIndex: number;
  fieldName: string;
  label?: string;
  type?: string;
  placeholder?: string;
  [key: string]: any;
}) {
  const { formState, updateField } = useStepperForm();

  const value = formState[tabIndex]?.fields[fieldName] || "";

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue =
      e.target.type === "checkbox"
        ? e.target.checked
        : type === "number"
        ? Number.parseFloat(e.target.value)
        : e.target.value;
    updateField(tabIndex, fieldName, newValue);
  };

  return (
    <FormField tabIndex={tabIndex} fieldName={fieldName}>
      {label && <label className="mb-2 block text-sm">{label}</label>}

      <input
        {...rest}
        id={fieldName}
        type={type}
        checked={
          type === "checkbox"
            ? (formState[tabIndex].fields[fieldName] as boolean)
            : undefined
        }
        value={
          type !== "checkbox"
            ? (formState[tabIndex].fields[fieldName] as string)
            : undefined
        }
        placeholder={placeholder}
        onChange={handleChange}
        className="w-full rounded-lg border border-gray-300 px-4 py-4 focus:border-blue-500 focus:outline-none"
      />
    </FormField>
  );
}
