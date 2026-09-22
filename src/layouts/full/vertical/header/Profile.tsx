import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { GraduationCap } from "lucide-react";
import { Link } from "react-router";

import SyncBadge from "@/components/shared/sync-badge";
import { edital } from "@/lib/edital";

const AVATAR_URL =
  "https://pbs.twimg.com/profile_images/1910499117907820544/ku7g6wT-_400x400.jpg";

export default function ProfileSheet() {
  return (
    <Sheet>
      {/* Trigger Button */}
      <SheetTrigger className="cursor-pointer hover:bg-primary/5 flex items-center justify-center rounded-full h-10 w-10">
        <Avatar className="h-8 w-8">
          <AvatarImage src={AVATAR_URL} alt="Avatar do perfil" />
          <AvatarFallback>EG</AvatarFallback>
        </Avatar>
      </SheetTrigger>

      {/* Drawer Panel */}
      <SheetContent
        showCloseButton={false}
        side="right"
        className="border-s-0 w-full sm:max-w-80 max-w-60"
      >
        <SheetClose className="absolute top-5 end-5 p-2 hover:bg-primary/5 hover:text-primary rounded-full">
          <Icon icon="tabler:x" width={20} height={20} />
        </SheetClose>

        {/* App Section */}
        <SheetHeader className="p-6">
          <div className="flex flex-col gap-4 justify-center items-center pt-10">
            <Avatar className="h-16 w-16">
              <AvatarImage src={AVATAR_URL} alt="Avatar do perfil" width={30} height={30} />
              <AvatarFallback>
                <GraduationCap size={26} />
              </AvatarFallback>
            </Avatar>

            <div className="text-center">
              <SheetTitle className="text-lg font-semibold">
                Estudos Gaya
              </SheetTitle>
              <p className="text-sm font-normal text-muted-foreground">
                {edital.concurso} — {edital.cargo}
              </p>
            </div>

            <SyncBadge />
          </div>
        </SheetHeader>

        {/* Footer */}
        <SheetFooter className="px-0 pb-6">
          <div className="border-t border-border w-full">
            <div className="px-6 pt-6">
              <Button
                className="w-full cursor-pointer"
                render={<Link to="/edital" />}
              >
                Abrir edital
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
