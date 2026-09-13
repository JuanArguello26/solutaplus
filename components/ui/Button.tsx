import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/30",
  secondary:
    "bg-secondary text-secondary-foreground shadow-md shadow-secondary/25 hover:bg-secondary-hover hover:shadow-lg hover:shadow-secondary/30",
  outline: "border border-gray-300 text-gray-900 hover:border-gray-400 hover:bg-gray-50",
  ghost: "text-gray-700 hover:bg-gray-100",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-base font-medium transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0 motion-reduce:transition-colors motion-reduce:hover:translate-y-0";

interface CommonProps {
  variant?: ButtonVariant;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
}

type ButtonAsButton = CommonProps & {
  href?: undefined;
} & Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "className" | "children"
  >;

type ButtonAsLink = CommonProps & {
  href: string;
} & Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    "className" | "children" | "href"
  >;

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    loading = false,
    className = "",
    children,
  } = props;
  const classes = `${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${className}`;
  const spinner = loading ? (
    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
  ) : null;

  if (props.href !== undefined) {
    const {
      href,
      variant: _variant,
      loading: _loading,
      className: _className,
      children: _children,
      ...anchorProps
    } = props as ButtonAsLink;
    const isExternal = /^https?:\/\//.test(href);

    return (
      <a
        href={href}
        className={classes}
        {...(isExternal
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
        {...anchorProps}
      >
        {spinner}
        {children}
      </a>
    );
  }

  const {
    variant: _variant,
    loading: _loading,
    className: _className,
    children: _children,
    href: _href,
    ...buttonProps
  } = props as ButtonAsButton;

  return (
    <button
      type="button"
      className={classes}
      disabled={loading || buttonProps.disabled}
      aria-busy={loading}
      {...buttonProps}
    >
      {spinner}
      {children}
    </button>
  );
}
