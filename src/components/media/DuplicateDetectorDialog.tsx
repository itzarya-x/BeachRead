
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useData } from "@/context/DataContext";
import { Eye, RefreshCw, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function DuplicateDetectorDialog() {
    const { duplicateCheck, resolveDuplicate, getTitle } = useData();
    const navigate = useNavigate();

    if (!duplicateCheck) return null;

    const { existing, pending } = duplicateCheck;
    const title = getTitle(existing);

    const handleAction = async (action: "view" | "update" | "cancel") => {
        if (action === "view") {
            const path = existing.mediaType === "ANIME" ? `/anime/${existing._seriesId}` : `/manga/${existing._seriesId}`;
            navigate(path);
            resolveDuplicate("cancel"); // Close the dialog
        } else {
            await resolveDuplicate(action);
        }
    };

    return (
        <AlertDialog open={!!duplicateCheck} onOpenChange={(open) => !open && resolveDuplicate("cancel")}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-orange-500" />
                        Duplicate Entry Detected
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        <strong>{title}</strong> already exists in your vault. 
                        Do you want to view the existing entry or update it with new information?
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="flex flex-col gap-3 py-4">
                    <div className="flex items-center gap-4 p-3 bg-secondary/30 rounded-lg border border-border/50">
                        {existing.coverImage && (
                            <img 
                                src={existing.coverImage} 
                                alt={title} 
                                className="w-16 h-20 object-cover rounded shadow-sm"
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{title}</p>
                            <p className="text-xs text-muted-foreground">
                                Status: {existing.status} • Score: {existing.score}
                            </p>
                        </div>
                    </div>
                </div>

                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <Button 
                        variant="ghost" 
                        className="sm:mr-auto" 
                        onClick={() => handleAction("cancel")}
                    >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                    </Button>
                    
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => handleAction("view")}
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                        </Button>
                        <Button 
                            variant="default" 
                            onClick={() => handleAction("update")}
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Update
                        </Button>
                    </div>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
