import { PropsWithChildren } from "react";

type ErrorMessageProps = PropsWithChildren<{
  className?: string;
}>;

const ErrorMessage = ({ children, className = "" }: ErrorMessageProps) => {
  if (!children) return null;

  return <p className={`text-error ${className}`}>{children}</p>;
};

export default ErrorMessage;
