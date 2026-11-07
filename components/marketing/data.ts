import { Boxes, Building2, CalendarClock, Clock, Route, Zap, type LucideIcon } from "lucide-react";

export interface ServiceInfo {
  id: string;
  title: string;
  icon: LucideIcon;
  summary: string;
  details: string[];
  from: string;
}

export const SERVICES: ServiceInfo[] = [
  {
    id: "same-day",
    title: "Same-day delivery",
    icon: Clock,
    summary: "Book before 3pm and your package arrives the same evening, anywhere within the city.",
    details: ["Delivery before 9pm", "Live status updates", "Ideal for retail orders and documents"],
    from: "₦2,500",
  },
  {
    id: "express",
    title: "Express delivery",
    icon: Zap,
    summary: "Priority handling with the nearest available rider for urgent, time-critical items.",
    details: ["Rider dispatched in minutes", "Delivered within 6 hours", "Priority support line"],
    from: "₦3,200",
  },
  {
    id: "scheduled",
    title: "Scheduled delivery",
    icon: CalendarClock,
    summary: "Choose the date and time window that suits you or your customer, up to 14 days ahead.",
    details: ["Pick a 2-hour window", "Reminders for sender and recipient", "5% cheaper than standard"],
    from: "₦1,800",
  },
  {
    id: "business",
    title: "Business logistics",
    icon: Building2,
    summary: "One account for your team, with invoicing, saved addresses and reporting for every delivery.",
    details: ["Monthly invoicing", "Multi-user access", "Delivery reports and exports"],
    from: "Custom",
  },
  {
    id: "bulk",
    title: "Bulk shipments",
    icon: Boxes,
    summary: "Move many parcels at once with vans and trucks from our verified partner fleet.",
    details: ["Vans and trucks on demand", "Per-item discounts", "Loading support on request"],
    from: "₦12,000",
  },
  {
    id: "intercity",
    title: "Intercity delivery",
    icon: Route,
    summary: "Send between Lagos, Ibadan, Abuja, Port Harcourt, Kano and more with tracked handoffs.",
    details: ["Door-to-door across states", "Delivered in 24 to 48 hours", "Handled by vetted partners"],
    from: "₦6,500",
  },
];

export const HOW_IT_WORKS = [
  { title: "Create an account", body: "Sign up in under a minute with your email and Nigerian phone number." },
  { title: "Book your delivery", body: "Add pickup and drop-off details, describe the package and choose a delivery speed." },
  { title: "Get matched with a rider", body: "We match you with a verified rider nearby, ranked by distance, rating and vehicle size." },
  { title: "Track your shipment", body: "Follow every step from pickup to drop-off with a clear timeline and arrival estimate." },
  { title: "Confirm successful delivery", body: "The recipient shares a 4-digit PIN with the rider, so nobody can fake a delivery." },
];

export const TESTIMONIALS = [
  {
    quote: "We moved our Lekki and Ikeja orders to SwiftLogix in March. Same-day completion went from about 70% to almost every order, and customers stopped calling to ask where things are.",
    name: "Ifeoma Nwachukwu",
    role: "Founder, Ìfé Skincare",
    city: "Lagos",
  },
  {
    quote: "The delivery PIN is what sold me. Our pharmacy can prove every handover, and the rider can't mark anything delivered until the patient confirms.",
    name: "Dr. Yusuf Abdullahi",
    role: "Operations Lead, CarePoint Pharmacy",
    city: "Abuja",
  },
  {
    quote: "As a fleet owner, I can see which bikes are working, assign jobs to my riders and get paid weekly. It is the first platform that treats partners like partners.",
    name: "Babatunde Ogunleye",
    role: "MD, Greenline Haulage",
    city: "Ibadan",
  },
];

export const FAQS = [
  {
    q: "Which cities do you deliver in?",
    a: "Same-day and express delivery run in Lagos, Ibadan, Abuja, Port Harcourt and Kano. Intercity delivery connects all 36 states and the FCT through our partner network.",
  },
  {
    q: "How is the delivery price calculated?",
    a: "Price is based on distance, package weight, number of items and the delivery speed you choose. You always see the full breakdown before you confirm, with no hidden fees.",
  },
  {
    q: "What is the delivery PIN?",
    a: "Every shipment gets a 4-digit PIN that we share with you. The recipient gives it to the rider at drop-off, and the delivery is only marked complete when the PIN matches.",
  },
  {
    q: "Can I cancel a booking?",
    a: "Yes. You can cancel at no cost until the rider picks up your package. Refunds go back to your original payment method.",
  },
  {
    q: "What items can't I send?",
    a: "We don't carry cash, weapons, illegal substances, live animals or hazardous materials. Fragile items are accepted with the fragile handling option.",
  },
  {
    q: "How do riders and logistics companies get paid?",
    a: "Riders earn a fixed share of each completed delivery and can request a payout to any Nigerian bank. Partners receive weekly settlements for deliveries their riders complete.",
  },
];

export const STATS = [
  { value: "120k+", label: "Deliveries made" },
  { value: "98.4%", label: "On-time rate" },
  { value: "2,300+", label: "Verified riders" },
  { value: "36", label: "States covered" },
];
