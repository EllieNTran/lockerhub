import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-dark-blue group-[.toaster]:border-primary-outline group-[.toaster]:shadow-lg",
          success:
            "group toast group-[.toaster]:!bg-success-foreground group-[.toaster]:!text-success group-[.toaster]:!border-success-outline group-[.toaster]:shadow-lg",
          error:
            "group toast group-[.toaster]:!bg-error-foreground group-[.toaster]:!text-error group-[.toaster]:!border-error-outline group-[.toaster]:shadow-lg",
          info:
            "group toast group-[.toaster]:!bg-primary-foreground group-[.toaster]:!text-primary group-[.toaster]:!border-primary-outline group-[.toaster]:shadow-lg",
          description: "group-[.toast]:!text-current group-[.toast]:!opacity-60",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-background",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
