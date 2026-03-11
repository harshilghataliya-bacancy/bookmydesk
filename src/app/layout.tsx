import type { Metadata } from "next";
import "./globals.css";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "BookMyDesk — Bacancy Hackathon",
  description: "Book your desk for the Bacancy Technology hackathon event",
};

async function getMyBooking(userId: string | undefined) {
  if (!userId) return null;
  try {
    const booking = await prisma.booking.findUnique({
      where: { userId },
      include: {
        desk: {
          include: {
            room: {
              include: {
                section: {
                  include: { floor: true },
                },
              },
            },
          },
        },
      },
    });
    if (!booking) return null;
    return {
      deskNumber: booking.desk.deskNumber,
      roomName: booking.desk.room.name,
      sectionLabel: booking.desk.room.section.label,
      floorName: booking.desk.room.section.floor.name,
    };
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: session.user.role,
      }
    : null;
  const myBooking = await getMyBooking(user?.id);

  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        <Providers>
          <Navbar user={user} myBooking={myBooking} />
          <main className="flex-1">{children}</main>
          <Footer show={!!user} />
        </Providers>
      </body>
    </html>
  );
}
