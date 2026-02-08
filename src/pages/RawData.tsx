import { PageContent, PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { JsonExplorer } from "@/components/raw-data/JsonExplorer";
import { useData } from "@/context/DataContext";

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
                    subtitle="Complete GDPR JSON export — searchable and expandable."
                />
                <PageContent>
                    <p className="text-destructive">No raw data available.</p>
                </PageContent>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper>
            <PageHeader
                title="Raw Data Explorer"
                subtitle="Complete GDPR JSON export — searchable and expandable. All IDs visible here only."
            />
            <PageContent className="space-y-4">
                <JsonExplorer data={rawData} />
            </PageContent>
        </PageWrapper>
    );
};

export default RawData;
