import { PageContent, PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { JsonExplorer } from "@/components/raw-data/JsonExplorer";
import { useData } from "@/context/DataContext";
import { Database } from "lucide-react";

const RawData = () => {
    const { rawData, loading } = useData();

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!rawData) {
        return (
            <PageWrapper>
                <PageHeader
                    title="Raw Data Explorer"
                    subtitle="Inspect your full GDPR export with searchable nested JSON."
                    icon={Database}
                />
                <PageContent>
                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive-foreground">
                        No raw data available.
                    </div>
                </PageContent>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper>
            <PageHeader
                title="Raw Data Explorer"
                subtitle="Complete GDPR JSON export — searchable, expandable, and intended for advanced inspection."
                icon={Database}
            />
            <PageContent className="space-y-4">
                <JsonExplorer data={rawData} />
            </PageContent>
        </PageWrapper>
    );
};

export default RawData;
