import ProductPage from "./ProductPage";
import { Smartphone, Music, BookOpen, Download, Wifi, PlayCircle } from "lucide-react";

export default function RhythmstixApp() {
  return (
    <ProductPage
      name="Rhythmstix App"
      subtitle="Interactive Teaching Tools in Your Pocket"
      icon={Smartphone}
      description={[
        "The Rhythmstix App puts interactive teaching tools, backing tracks, and music resources directly in your pocket. Designed for music teachers who need reliable, high-quality resources available at a moment's notice — whether you're in the classroom, the hall, or moving between schools.",
        "The app includes backing tracks for performances and classroom use, interactive resources for lessons, and quick-access tools that make teaching music more engaging. Everything is organised so you can find what you need quickly, even mid-lesson.",
        "Built to work on phones and tablets, the Rhythmstix App is a companion for teachers who want professional-quality music resources without carrying around stacks of CDs, USBs, and printed materials.",
      ]}
      features={[
        { icon: Music, title: "Backing Tracks", description: "High-quality backing tracks for performances and classroom use. Play, pause, and control tracks directly from your device." },
        { icon: BookOpen, title: "Lesson Resources", description: "Interactive resources designed to support music lessons. Lyrics, scores, and teaching aids all in one place." },
        { icon: PlayCircle, title: "Interactive Playback", description: "Control playback with ease. Loop sections, adjust tempo, and switch between vocal and backing-only versions." },
        { icon: Download, title: "Offline Access", description: "Download resources for offline use. No need to rely on school Wi-Fi when you're in the hall or between rooms." },
        { icon: Wifi, title: "Cloud Sync", description: "Resources sync across devices so you always have the latest content. Start on your phone, continue on your tablet." },
        { icon: Smartphone, title: "Mobile-First", description: "Designed for phones and tablets. Touch-friendly interface that works well even when you're standing in front of a class." },
      ]}
      pros={[
        "Professional-quality backing tracks always available",
        "Works on phones and tablets — truly portable",
        "Offline access means no Wi-Fi dependency",
        "Interactive playback controls for classroom use",
        "Organised library makes finding resources quick",
        "Replaces CDs, USBs, and printed materials",
        "Syncs across devices via cloud",
        "Touch-friendly interface designed for teaching contexts",
      ]}
      considerations={[
        "Initial download required for offline content",
        "Some features require an active subscription",
        "Best experienced on tablet for larger display",
        "Audio quality depends on device speakers — external speakers recommended for performances",
      ]}
      ctaHeading="Your music classroom, in your pocket"
      ctaText="The Rhythmstix App gives music teachers instant access to backing tracks, interactive resources, and teaching tools — anywhere, anytime."
    />
  );
}
