import { PageWrapper } from "@/components/layout/PageWrapper";
import { useData } from "@/context/DataContext";
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { formatScore, STATUS_LABELS } from "@/lib/constants";
import {
    ArrowLeft,
    BookOpen,
    Calendar,
    Check,
    EyeOff,
    Hash,
    Layers,
    Loader,
    Lock,
    MessageSquare,
    Play,
    Repeat,
    Save,
    Star,
    Tag,
    Trash2,
    X,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

const MediaDetail = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { animeList, mangaList, user, getTitle, loading, updateEntry, deleteEntry } = useData();

    const mediaType = location.pathname.startsWith("/anime") ? "ANIME" : "MANGA";
    const backPath = `/${mediaType.toLowerCase()}`;

    // State for inline editing
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const media = useMemo(() => {
        const list = mediaType === "ANIME" ? animeList : mangaList;
        return list.find(m => m._seriesId === Number(id)) || null;
    }, [id, mediaType, animeList, mangaList]);

    const [personalComment, setPersonalComment] = useLocalStorage(`media-comment-${id}`, "");

    // Part 4: Calculate total count correctly
    const progressLabel = useMemo(() => {
        if (!media) return "0 / 0";
        const total = media.episodes || media.chapters || media.volumes || 0;
        return `${media.progress} / ${total > 0 ? total : "?"}`;
    }, [media]);

    // Part 3: Auto-fill progress when status is Completed
    const handleSaveField = useCallback(
        async (field: string, value: any) => {
            if (!media) return;

            try {
                setIsSaving(true);
                let updates: any = { [field]: value };

                // Part 3.1: Auto-fill progress if status = Completed
                if (field === "status" && value === "COMPLETED") {
                    const total = media.episodes || media.chapters || media.volumes;
                    if (total && total > 0) {
                        updates.progress = total;
                    } else {
                        toast({
                            title: "Warning",
                            description: "Total count unknown. Please set progress manually.",
                            variant: "destructive",
                        });
                    }
                }

                // Part 1.3: Optimistic update - UI updates immediately
                // The updateEntry function will handle DB write in background
                await updateEntry(media._entryId, updates);

                // Part 1.4: Confirm save
                toast({
                    title: "Saved",
                    description: `${field} updated successfully`,
                });

                setEditingField(null);
            } catch (error) {
                console.error("Failed to save field:", error);
                toast({
                    title: "Error",
                    description: "Failed to save changes",
                    variant: "destructive",
                });
                // Revert optimistic change if needed
                setEditValue(null);
            } finally {
                setIsSaving(false);
            }
        },
        [media, updateEntry, toast],
    );

    // Part 2: Delete with confirmation
    const handleDelete = useCallback(async () => {
        if (!media) return;

        try {
            setIsDeleting(true);
            await deleteEntry(media._entryId);

            toast({
                title: "Deleted",
                description: "Item removed from all lists",
            });

            // Part 2.4: After delete - navigate back
            navigate(backPath);
        } catch (error) {
            console.error("Failed to delete:", error);
            toast({
                title: "Error",
                description: "Failed to delete item",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    }, [media, deleteEntry, navigate, backPath, toast]);

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!media || !user) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-10 text-center">
                <p className="text-muted-foreground text-lg mb-4">Media not found</p>
                <Link to={backPath} className="text-primary hover:underline inline-flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" /> Back to {mediaType === "ANIME" ? "Anime" : "Manga"} Vault
                </Link>
            </div>
        );
    }

    const title = getTitle(media);
    const scoreFormat = user.scoreFormat;
    const statusLabel = STATUS_LABELS[media.status]?.[media.mediaType] || media.status;

    const hasAdvancedScores = media.advancedScores.length > 0 && media.advancedScores.some(s => s > 0);

    return (
        <PageWrapper>
            <div className="animate-fade-in">
                {/* Hero banner */}
                <div className="relative h-56 md:h-72 lg:h-80 overflow-hidden">
                    {media.bannerImage ? (
                        <img src={media.bannerImage} alt="" className="w-full h-full object-cover" />
                    ) : media.coverImage ? (
                        <img
                            src={media.coverImage}
                            alt=""
                            className="w-full h-full object-cover blur-2xl scale-110 opacity-40"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 via-surface-1 to-accent/10" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

                    {/* Back button */}
                    <div className="absolute top-4 left-4 z-10">
                        <Link
                            to={backPath}
                            className="flex items-center gap-2 bg-surface-0/70 backdrop-blur-sm text-foreground px-3 py-2 rounded-xl text-sm font-medium hover:bg-surface-0/90 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Link>
                    </div>
                </div>

                {/* Main content */}
                <div className="max-w-5xl mx-auto px-4 -mt-24 md:-mt-32 relative z-10">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Cover */}
                        <div className="shrink-0">
                            <div className="w-44 md:w-52 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl ring-2 ring-border/20">
                                {media.coverImage ? (
                                    <img src={media.coverImage} alt={title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-surface-2 flex items-center justify-center">
                                        {media.mediaType === "ANIME" ? (
                                            <Play className="w-12 h-12 text-muted-foreground/30" />
                                        ) : (
                                            <BookOpen className="w-12 h-12 text-muted-foreground/30" />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 pt-2 md:pt-12">
                            <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-extrabold text-foreground mb-2 text-shadow-sm">
                                {title}
                            </h1>

                            {/* Alternative titles */}
                            {media.title.english && media.title.english !== title && (
                                <p className="text-sm text-muted-foreground mb-1">{media.title.english}</p>
                            )}
                            {media.title.native && (
                                <p className="text-sm text-muted-foreground mb-3">{media.title.native}</p>
                            )}

                            {/* Tags */}
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                <span className={`status-badge status-${media.status.toLowerCase()}`}>
                                    {statusLabel}
                                </span>
                                {media.format && (
                                    <span className="text-xs bg-surface-3 text-secondary-foreground px-2.5 py-1 rounded-full font-semibold uppercase">
                                        {media.format}
                                    </span>
                                )}
                                {media.isPrivate && (
                                    <span className="text-xs bg-destructive/20 text-destructive px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1">
                                        <Lock className="w-3 h-3" />
                                        Private
                                    </span>
                                )}
                                {media.hiddenDefault && (
                                    <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1">
                                        <EyeOff className="w-3 h-3" />
                                        Hidden
                                    </span>
                                )}
                                {media.seasonYear && (
                                    <span className="text-xs text-muted-foreground">
                                        {media.season} {media.seasonYear}
                                    </span>
                                )}
                            </div>

                            {/* Genres */}
                            {media.genres.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-5">
                                    {media.genres.map(g => (
                                        <span
                                            key={g}
                                            className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium"
                                        >
                                            {g}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats summary - EDITABLE */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
                        <EditableStatBox
                            icon={Star}
                            label="Score"
                            value={media.score > 0 ? formatScore(media.score, scoreFormat) : "Unscored"}
                            displayValue={media.score}
                            isEditing={editingField === "score"}
                            isSaving={isSaving && editingField === "score"}
                            onEdit={() => {
                                setEditingField("score");
                                setEditValue(media.score);
                            }}
                            onSave={val => handleSaveField("score", parseFloat(val) || 0)}
                            onCancel={() => setEditingField(null)}
                            type="number"
                            min={0}
                            max={10}
                        />
                        <EditableStatBox
                            icon={Hash}
                            label="Progress"
                            value={progressLabel}
                            displayValue={media.progress}
                            isEditing={editingField === "progress"}
                            isSaving={isSaving && editingField === "progress"}
                            onEdit={() => {
                                setEditingField("progress");
                                setEditValue(media.progress);
                            }}
                            onSave={val => handleSaveField("progress", parseInt(val) || 0)}
                            onCancel={() => setEditingField(null)}
                            type="number"
                            min={0}
                        />
                        <EditableStatBox
                            icon={Repeat}
                            label="Rewatches"
                            value={String(media.repeat)}
                            displayValue={media.repeat}
                            isEditing={editingField === "repeat"}
                            isSaving={isSaving && editingField === "repeat"}
                            onEdit={() => {
                                setEditingField("repeat");
                                setEditValue(media.repeat);
                            }}
                            onSave={val => handleSaveField("repeat", parseInt(val) || 0)}
                            onCancel={() => setEditingField(null)}
                            type="number"
                            min={0}
                        />
                        <EditableStatBox
                            icon={Calendar}
                            label="Started"
                            value={media.startedAt || "—"}
                            displayValue={media.startedAt}
                            isEditing={editingField === "startedAt"}
                            isSaving={isSaving && editingField === "startedAt"}
                            onEdit={() => {
                                setEditingField("startedAt");
                                setEditValue(media.startedAt || "");
                            }}
                            onSave={val => handleSaveField("startedAt", val || null)}
                            onCancel={() => setEditingField(null)}
                            type="date"
                        />
                    </div>

                    {/* Description */}
                    {media.description && (
                        <div className="mt-8 bg-card rounded-xl border border-border/40 p-5">
                            <h2 className="font-display text-lg font-bold text-foreground mb-3">Description</h2>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {media.description.replace(/<[^>]*>/g, "")}
                            </p>
                        </div>
                    )}

                    {/* Personal comments (Yura box) */}
                    <div className="mt-6 bg-card rounded-xl border border-border/40 p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <MessageSquare className="w-5 h-5 text-accent" />
                            <h2 className="font-display text-lg font-bold text-foreground">My Notes</h2>
                        </div>

                        {/* GDPR notes */}
                        {media.notes && (
                            <div className="mb-4 bg-surface-1 rounded-lg p-3 border border-border/30">
                                <p className="text-xs text-muted-foreground font-medium mb-1">
                                    Original Notes (from GDPR)
                                </p>
                                <p className="text-sm text-foreground whitespace-pre-wrap">{media.notes}</p>
                            </div>
                        )}

                        {/* Personal comment textarea */}
                        <textarea
                            value={personalComment}
                            onChange={e => setPersonalComment(e.target.value)}
                            placeholder="Add your personal thoughts, reviews, or notes…"
                            className="w-full bg-surface-1 border border-border/40 rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/40 transition-all resize-y min-h-[100px]"
                        />
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Save className="w-3 h-3" />
                            Auto-saved locally
                        </p>
                    </div>

                    {/* Advanced Scores */}
                    {hasAdvancedScores && (
                        <div className="mt-6 bg-card rounded-xl border border-border/40 p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Layers className="w-5 h-5 text-primary" />
                                <h2 className="font-display text-lg font-bold text-foreground">Advanced Scores</h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {media.advancedScores.map((score, idx) => {
                                    const label = user.advancedScoresNames[idx] || `Category ${idx + 1}`;
                                    return (
                                        <div
                                            key={idx}
                                            className="flex justify-between items-center bg-surface-1 rounded-lg px-3 py-2 text-sm"
                                        >
                                            <span className="text-muted-foreground">{label}</span>
                                            <span className="text-foreground font-bold">{score > 0 ? score : "—"}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Custom Lists */}
                    {media.customLists.length > 0 && (
                        <div className="mt-6 bg-card rounded-xl border border-border/40 p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Tag className="w-5 h-5 text-primary" />
                                <h2 className="font-display text-lg font-bold text-foreground">Custom Lists</h2>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {media.customLists.map(list => (
                                    <span
                                        key={list}
                                        className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium"
                                    >
                                        {list}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Full Details - EDITABLE with Delete Button */}
                    <div className="mt-6 mb-12 bg-card rounded-xl border border-border/40 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-display text-lg font-bold text-foreground">All Details</h2>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="p-2 hover:bg-destructive/20 rounded-lg text-destructive transition-colors"
                                title="Delete this item"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <EditableDetailRow
                                label="Status"
                                value={statusLabel}
                                isEditing={editingField === "status"}
                                isSaving={isSaving && editingField === "status"}
                                onEdit={() => {
                                    setEditingField("status");
                                    setEditValue(media.status);
                                }}
                                onSave={val => handleSaveField("status", val)}
                                onCancel={() => setEditingField(null)}
                                type="select"
                                options={["CURRENT", "PLANNING", "COMPLETED", "DROPPED", "PAUSED", "REPEATING"]}
                            />
                            <EditableDetailRow
                                label="Score (raw)"
                                value={media.score > 0 ? String(media.score) : "—"}
                                isEditing={editingField === "score"}
                                isSaving={isSaving && editingField === "score"}
                                onEdit={() => {
                                    setEditingField("score");
                                    setEditValue(media.score);
                                }}
                                onSave={val => handleSaveField("score", parseFloat(val) || 0)}
                                onCancel={() => setEditingField(null)}
                                type="number"
                                min="0"
                                max="10"
                            />
                            <EditableDetailRow
                                label="Progress"
                                value={progressLabel}
                                isEditing={editingField === "progress"}
                                isSaving={isSaving && editingField === "progress"}
                                onEdit={() => {
                                    setEditingField("progress");
                                    setEditValue(media.progress);
                                }}
                                onSave={val => handleSaveField("progress", parseInt(val) || 0)}
                                onCancel={() => setEditingField(null)}
                                type="number"
                                min="0"
                            />
                            <EditableDetailRow
                                label="Repeat"
                                value={String(media.repeat)}
                                isEditing={editingField === "repeat"}
                                isSaving={isSaving && editingField === "repeat"}
                                onEdit={() => {
                                    setEditingField("repeat");
                                    setEditValue(media.repeat);
                                }}
                                onSave={val => handleSaveField("repeat", parseInt(val) || 0)}
                                onCancel={() => setEditingField(null)}
                                type="number"
                                min="0"
                            />
                            <EditableDetailRow
                                label="Priority"
                                value={String(media.priority)}
                                isEditing={editingField === "priority"}
                                isSaving={isSaving && editingField === "priority"}
                                onEdit={() => {
                                    setEditingField("priority");
                                    setEditValue(media.priority);
                                }}
                                onSave={val => handleSaveField("priority", parseInt(val) || 0)}
                                onCancel={() => setEditingField(null)}
                                type="number"
                                min="0"
                                max="100"
                            />
                            <EditableDetailRow
                                label="Private"
                                value={media.isPrivate ? "Yes" : "No"}
                                isEditing={editingField === "isPrivate"}
                                isSaving={isSaving && editingField === "isPrivate"}
                                onEdit={() => {
                                    setEditingField("isPrivate");
                                    setEditValue(media.isPrivate);
                                }}
                                onSave={val => handleSaveField("isPrivate", val === "true" || val === true)}
                                onCancel={() => setEditingField(null)}
                                type="select"
                                options={["No", "Yes"]}
                            />
                            <EditableDetailRow
                                label="Hidden Default"
                                value={media.hiddenDefault ? "Yes" : "No"}
                                isEditing={editingField === "hiddenDefault"}
                                isSaving={isSaving && editingField === "hiddenDefault"}
                                onEdit={() => {
                                    setEditingField("hiddenDefault");
                                    setEditValue(media.hiddenDefault);
                                }}
                                onSave={val => handleSaveField("hiddenDefault", val === "true" || val === true)}
                                onCancel={() => setEditingField(null)}
                                type="select"
                                options={["No", "Yes"]}
                            />
                            <DetailRow label="Media Type" value={media.mediaType} />
                            <DetailRow label="Created" value={new Date(media.createdAt).toLocaleString()} />
                            <DetailRow label="Updated" value={new Date(media.updatedAt).toLocaleString()} />
                            {media.format && <DetailRow label="Format (API)" value={media.format} />}
                            {media.episodes !== null && (
                                <DetailRow label="Total Episodes (API)" value={String(media.episodes)} />
                            )}
                            {media.chapters !== null && (
                                <DetailRow label="Total Chapters (API)" value={String(media.chapters)} />
                            )}
                            {media.volumes !== null && (
                                <DetailRow label="Total Volumes (API)" value={String(media.volumes)} />
                            )}
                            {media.season && (
                                <DetailRow label="Season (API)" value={`${media.season} ${media.seasonYear || ""}`} />
                            )}
                        </div>
                    </div>

                    {/* Delete Confirmation Modal */}
                    {showDeleteConfirm && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-card border border-border rounded-xl shadow-2xl max-w-sm w-full">
                                <div className="p-6">
                                    <h3 className="text-lg font-bold text-foreground mb-2">Delete Item?</h3>
                                    <p className="text-muted-foreground mb-4">
                                        This will permanently remove "{title}" from Yura.
                                    </p>
                                    <p className="text-sm text-destructive font-medium mb-6">This cannot be undone.</p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowDeleteConfirm(false)}
                                            className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            disabled={isDeleting}
                                            className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                        >
                                            {isDeleting ? (
                                                <>
                                                    <Loader className="w-4 h-4 animate-spin" />
                                                    Deleting...
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 className="w-4 h-4" />
                                                    Delete
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PageWrapper>
    );
};

function StatBox({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: string }) {
    return (
        <div className="bg-card rounded-xl border border-border/40 p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
            </div>
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-bold text-foreground">{value}</p>
            </div>
        </div>
    );
}

interface EditableStatBoxProps {
    icon: typeof Star;
    label: string;
    value: string;
    displayValue: any;
    isEditing: boolean;
    isSaving: boolean;
    onEdit: () => void;
    onSave: (value: any) => void;
    onCancel: () => void;
    type?: "text" | "number" | "date";
    min?: number | string;
    max?: number | string;
}

function EditableStatBox({
    icon: Icon,
    label,
    value,
    displayValue,
    isEditing,
    isSaving,
    onEdit,
    onSave,
    onCancel,
    type = "text",
    min,
    max,
}: EditableStatBoxProps) {
    const [inputValue, setInputValue] = useState<string>(String(displayValue || ""));

    return (
        <div
            className="bg-card rounded-xl border border-border/40 p-4 flex items-start gap-3 cursor-pointer hover:border-primary/30 transition-colors group"
            onClick={() => !isEditing && onEdit()}
        >
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
            </div>
            {isEditing ? (
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-2">{label}</p>
                    <div className="flex gap-2 items-center">
                        <input
                            type={type}
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            min={min}
                            max={max}
                            onKeyDown={e => {
                                if (e.key === "Enter") onSave(inputValue);
                                if (e.key === "Escape") onCancel();
                            }}
                            className="flex-1 px-2 py-1 bg-surface-1 border border-border rounded text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                            autoFocus
                        />
                        <button
                            onClick={() => onSave(inputValue)}
                            disabled={isSaving}
                            className="p-1 hover:bg-primary/20 rounded text-primary disabled:opacity-50"
                        >
                            {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={onCancel}
                            disabled={isSaving}
                            className="p-1 hover:bg-destructive/20 rounded text-destructive disabled:opacity-50"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-bold text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to edit
                    </p>
                </div>
            )}
        </div>
    );
}

interface EditableDetailRowProps {
    label: string;
    value: string;
    isEditing: boolean;
    isSaving: boolean;
    onEdit: () => void;
    onSave: (value: any) => void;
    onCancel: () => void;
    type?: "text" | "number" | "date" | "select";
    min?: string;
    max?: string;
    options?: string[];
}

function EditableDetailRow({
    label,
    value,
    isEditing,
    isSaving,
    onEdit,
    onSave,
    onCancel,
    type = "text",
    min,
    max,
    options,
}: EditableDetailRowProps) {
    const [inputValue, setInputValue] = useState<string>(String(value || ""));

    return (
        <div className="py-2 border-b border-border/20 group">
            {isEditing ? (
                <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground text-xs">{label}</span>
                    <div className="flex gap-1 items-center">
                        {type === "select" && options ? (
                            <select
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                className="px-2 py-1 bg-surface-1 border border-border rounded text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                                autoFocus
                            >
                                {options.map(opt => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type={type}
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                min={min}
                                max={max}
                                onKeyDown={e => {
                                    if (e.key === "Enter") onSave(inputValue);
                                    if (e.key === "Escape") onCancel();
                                }}
                                className="px-2 py-1 bg-surface-1 border border-border rounded text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                                autoFocus
                            />
                        )}
                        <button
                            onClick={() => onSave(inputValue)}
                            disabled={isSaving}
                            className="p-1 hover:bg-primary/20 rounded text-primary disabled:opacity-50"
                        >
                            {isSaving ? <Loader className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        </button>
                        <button
                            onClick={onCancel}
                            disabled={isSaving}
                            className="p-1 hover:bg-destructive/20 rounded text-destructive disabled:opacity-50"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex justify-between py-1.5 cursor-pointer hover:bg-surface-1/50 px-2 -mx-2 rounded transition-colors">
                    <span className="text-muted-foreground text-sm" onClick={onEdit}>
                        {label}
                    </span>
                    <span className="text-foreground font-medium text-right flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {value}
                        <span className="text-xs text-muted-foreground">click to edit</span>
                    </span>
                </div>
            )}
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between py-1.5 border-b border-border/20">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-foreground font-medium text-right">{value}</span>
        </div>
    );
}

export default MediaDetail;
