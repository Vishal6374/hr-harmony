import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";

interface PageLoaderProps {
    className?: string;
    fullPage?: boolean;
}

export function PageLoader({ className, fullPage = true }: PageLoaderProps) {
    const content = (
        <div className={cn("flex items-center justify-center w-full h-[60vh]", className)}>
            <div className="animate-flip">
                <img
                    src="/favicon.png"
                    alt="Loading..."
                    className="w-16 h-16 rounded-full shadow-lg"
                />
            </div>
        </div>
    );

    if (fullPage) {
        return (
            <MainLayout>
                {content}
            </MainLayout>
        );
    }

    return content;
}
