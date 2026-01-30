import { cn } from "@/lib/utils";
import { MainLayout } from "@/components/layout/MainLayout";
import Loader from "@/components/ui/Loader";

interface PageLoaderProps {
    className?: string;
    fullPage?: boolean;
}

export function PageLoader({ className, fullPage = true }: PageLoaderProps) {
    const content = (
        <div className={cn("w-full min-h-[60vh] flex items-center justify-center", className)}>
            <Loader />
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
