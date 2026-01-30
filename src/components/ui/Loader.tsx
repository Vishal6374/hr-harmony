import "@/App.css";
import { cn } from "@/lib/utils";

interface LoaderProps {
    size?: 'default' | 'small';
    variant?: 'default' | 'white';
    className?: string;
}

export default function Loader({ size = 'default', variant = 'default', className }: LoaderProps) {
    return (
        <div className={cn(
            "loader",
            size === 'small' && "loader-small",
            variant === 'white' && "loader-white",
            className
        )}></div>
    );
}
