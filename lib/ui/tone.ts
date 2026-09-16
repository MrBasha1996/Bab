export type Tone = "neutral" | "success" | "warning" | "danger" | "info";

export const TONE_CLASSES: Record<
  Tone,
  { chip: string; banner: string; text: string; badge: "secondary" | "success" | "warning" | "destructive" | "info" }
> = {
  neutral: {
    chip: "bg-muted text-muted-foreground",
    banner: "border-border bg-muted text-muted-foreground",
    text: "text-muted-foreground",
    badge: "secondary",
  },
  success: {
    chip: "bg-success/10 text-success",
    banner: "border-success/40 bg-success/10 text-success",
    text: "text-success",
    badge: "success",
  },
  warning: {
    chip: "bg-warning/10 text-warning",
    banner: "border-warning/40 bg-warning/10 text-warning",
    text: "text-warning",
    badge: "warning",
  },
  danger: {
    chip: "bg-destructive/10 text-destructive",
    banner: "border-destructive/40 bg-destructive/10 text-destructive",
    text: "text-destructive",
    badge: "destructive",
  },
  info: {
    chip: "bg-info/10 text-info",
    banner: "border-info/40 bg-info/10 text-info",
    text: "text-info",
    badge: "info",
  },
};
