import { PageContent, PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { AutoBento } from "@/components/layout/AutoBento";
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
                <div className="page-container">
                    <PageHeader
                        title="Raw Data Explorer"
                        subtitle="Inspect your full GDPR export with searchable nested JSON."
                        icon={Database}
                    />
                </div>
                <PageContent className="max-w-none px-0">
                    <AutoBento maxWidth={1500}>
                        <div className="sakura-glass p-8 border-destructive/20 bg-destructive/5 text-center">
                            <p className="text-sm text-destructive font-black uppercase tracking-widest mb-2">Status: Null</p>
                            <p className="text-xs text-white/40 uppercase tracking-widest">No raw GDPR data detected in vault. Verify synchronisation state.</p>
                        </div>
                    </AutoBento>
                </PageContent>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper>
            <div className="page-container">
                <PageHeader
                    title="Raw Data Explorer"
                    subtitle="Complete GDPR JSON export — searchable, expandable, and intended for advanced inspection."
                    icon={Database}
                />
            </div>
            <PageContent className="space-y-10 max-w-none px-0">
                <AutoBento maxWidth={1500} minTileWidth={400}>
                    <div className="bento-span-2 sakura-glass p-6 flex flex-col justify-center shadow-depth1">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Vault Integrity</h3>
                        <p className="text-sm text-white/60 leading-relaxed font-medium">
                            Searchable nested JSON tree. Use filters to locate specific entry signal fragments.
                        </p>
                    </div>
                    <div className="sakura-glass p-6 flex flex-col justify-center text-center shadow-depth1">
                        <p className="text-2xl font-black text-foreground">Verified</p>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mt-1">Encryption State</p>
                    </div>
                </AutoBento>

                <div className="page-container">
                    <div className="sakura-glass p-8 shadow-depth2">
                        <JsonExplorer data={rawData} />
                    </div>
                </div>
            </PageContent>
        </PageWrapper>
    );
};

export default RawData;
