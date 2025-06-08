import { useCallback, useState } from "react";

/**
 * Custom hook for form handling
 * @param initialValues - Initial form values
 */
const useForm = <T extends Record<string, any>>(initialValues: T) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle input changes
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setValues((prev) => ({ ...prev, [name]: value }));

      // Clear error for this field when it's changed
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    },
    [errors]
  );

  // Reset form values
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  // Validate form fields
  const validate = useCallback(
    (validations: Record<keyof T, (value: any) => string | undefined>) => {
      const newErrors: Record<string, string> = {};
      let isValid = true;

      Object.keys(validations).forEach((key) => {
        const value = values[key];
        const validation = validations[key as keyof T];
        const error = validation(value);

        if (error) {
          newErrors[key] = error;
          isValid = false;
        }
      });

      setErrors(newErrors);
      return isValid;
    },
    [values]
  );

  return {
    values,
    errors,
    handleChange,
    resetForm,
    validate,
    setValues,
    setErrors,
  };
};

export default useForm;
