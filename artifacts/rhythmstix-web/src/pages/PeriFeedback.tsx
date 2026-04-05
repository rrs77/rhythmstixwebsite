import ProductPage from "./ProductPage";
import { CalendarDays, MessageSquare, Clock, BarChart3, Users, Bell } from "lucide-react";

export default function PeriFeedback() {
  return (
    <ProductPage
      name="PeriFeedback"
      subtitle="Feedback & Scheduling for Peripatetic Teachers"
      icon={CalendarDays}
      description={[
        "PeriFeedback is a dedicated feedback and scheduling solution designed for peripatetic (visiting) music teachers and the school departments they work with. It bridges the communication gap between visiting specialists and classroom teachers, heads of department, and parents.",
        "The platform allows peripatetic teachers to quickly log lesson feedback, track student progress, and share updates with schools — all from one place. Schools can view feedback from their visiting teachers, manage scheduling, and ensure that peripatetic lessons are properly integrated into the broader curriculum.",
        "Whether you're a solo peripatetic teacher visiting multiple schools or a music hub coordinating dozens of specialists, PeriFeedback keeps everyone informed and connected without the usual trail of emails, paper notes, and missed messages.",
      ]}
      features={[
        { icon: MessageSquare, title: "Lesson Feedback", description: "Quickly log feedback after each lesson. Structured forms ensure consistent, useful information for schools and parents." },
        { icon: CalendarDays, title: "Schedule Management", description: "Manage your teaching schedule across multiple schools. View availability, book slots, and handle cancellations in one place." },
        { icon: Clock, title: "Time Tracking", description: "Track lesson times and attendance automatically. Generate timesheets and attendance records for schools and invoicing." },
        { icon: BarChart3, title: "Progress Reports", description: "Build up a picture of each student's progress over time. Generate reports for parents' evenings and school reviews." },
        { icon: Users, title: "School Integration", description: "Schools can view feedback from all their visiting teachers in one dashboard. Heads of department stay informed without chasing updates." },
        { icon: Bell, title: "Notifications", description: "Automated notifications keep schools and parents updated. No more missed messages or forgotten feedback forms." },
      ]}
      pros={[
        "Purpose-built for peripatetic and visiting teachers",
        "Replaces paper forms, emails, and verbal feedback",
        "Schools get a single dashboard for all visiting teacher feedback",
        "Progress tracking builds over time for meaningful reports",
        "Schedule management across multiple schools",
        "Automated notifications reduce admin overhead",
        "Works on any device — log feedback on the go",
        "Supports music hubs coordinating multiple specialists",
      ]}
      considerations={[
        "Most valuable when both teacher and school adopt the platform",
        "Initial setup needed to configure schools and student lists",
        "Notification preferences should be configured to avoid overload",
        "Best suited for instrumental and specialist teaching contexts",
      ]}
      ctaHeading="Better feedback, less admin"
      ctaText="PeriFeedback connects peripatetic teachers with schools and parents — so feedback doesn't get lost between visits."
      externalUrl="https://www.perifeedback.co.uk/"
      externalLabel="Visit PeriFeedback"
    />
  );
}
