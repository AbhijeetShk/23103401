import Link from "next/link";

const Navbar = () => {
  return (
    <div className="flex gap-4 p-4 border-b">
      <Link href="/">All</Link>
      <Link href="/notifications?type=Event">Event</Link>
      <Link href="/notifications?type=Result">Result</Link>
      <Link href="/notifications?type=Placement">Placement</Link>
    </div>
  );
};

export default Navbar;