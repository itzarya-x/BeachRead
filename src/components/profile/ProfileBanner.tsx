import { useData } from "@/context/DataContext";
import { formatMinutes, getAvatarUrl } from "@/lib/constants";

export function ProfileBanner() {
  const { user } = useData();
  if (!user) return null;

  const joinDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="relative">
      {/* Banner */}
      <div className="h-48 md:h-64 bg-gradient-to-br from-primary/20 via-secondary to-surface-1 relative overflow-hidden">
        {user.bannerUrl && (
          <img
            src={user.bannerUrl}
            alt="Banner"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      </div>

      {/* Profile info overlay */}
      <div className="max-w-7xl mx-auto px-4 relative -mt-20">
        <div className="flex items-end gap-5">
          {/* Avatar */}
          <div className="shrink-0">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="w-24 h-24 md:w-32 md:h-32 rounded-lg object-cover ring-4 ring-background shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg bg-primary/20 ring-4 ring-background shadow-lg flex items-center justify-center text-primary text-3xl font-bold">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name and meta */}
          <div className="pb-2 flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground text-shadow-sm">
              {user.displayName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Joined {joinDate}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
