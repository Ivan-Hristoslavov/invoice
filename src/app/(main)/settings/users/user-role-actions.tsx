"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Define Role type locally since we're not using Prisma on client side
type Role = 'ADMIN' | 'OWNER' | 'MANAGER' | 'ACCOUNTANT' | 'VIEWER';
const editableRoles: Exclude<Role, "OWNER">[] = ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'VIEWER'];
import { UserCog, Check, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";

interface UserRoleActionsProps {
  userId: string;
  currentRole: Role;
  companyId: string;
  isCurrentUser: boolean;
}

export default function UserRoleActions({
  userId,
  currentRole,
  companyId,
  isCurrentUser,
}: UserRoleActionsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>(currentRole);
  const canEditRole = currentRole !== "OWNER";
  
  // Function to update user role
  const handleUpdateRole = async () => {
    if (selectedRole === currentRole) {
      setIsOpen(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: selectedRole,
          companyId,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Неуспешно обновяване на ролята на потребителя");
      }
      
      toast.success("Ролята на потребителя е обновена успешно");
      router.refresh();
    } catch (error) {
      console.error("Грешка при обновяване на ролята на потребителя:", error);
      toast.error("Неуспешно обновяване на ролята на потребителя");
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };
  
  // Function to remove user from company
  const handleRemoveUser = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Неуспешно премахване на потребителя");
      }
      
      toast.success("Потребителят е премахнат успешно");
      router.refresh();
    } catch (error) {
      console.error("Грешка при премахване на потребителя:", error);
      toast.error("Неуспешно премахване на потребителя");
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Действия с потребител"
          className="inline-flex min-h-9 items-center justify-center rounded-xl px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          <UserCog className="h-4 w-4" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Действия с потребител</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {canEditRole ? (
            <DropdownMenuItem onClick={() => setIsOpen(true)}>
              Промяна на роля
            </DropdownMenuItem>
          ) : null}
          {!isCurrentUser && (
            <DropdownMenuItem
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-red-600"
            >
              Премахни потребител
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {isOpen && canEditRole ? (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Промяна на роля на потребител</DialogTitle>
              <DialogDescription>
                Обновете ролята и разрешенията за този потребител.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="role">Роля</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(value) => setSelectedRole(value as Role)}
                  aria-label="Роля на потребителя"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Изберете роля" />
                  </SelectTrigger>
                  <SelectContent>
                    {editableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role === "ADMIN"
                          ? "Администратор"
                          : role === "MANAGER"
                            ? "Мениджър"
                            : role === "ACCOUNTANT"
                              ? "Счетоводител"
                              : "Наблюдател"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Разрешения на ролята</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedRole === "OWNER" && (
                    "Пълен достъп до всички функции на компанията, включително управление на потребители."
                  )}
                  {selectedRole === "MANAGER" && (
                    "Може да създава и управлява повечето ресурси, но не може да изтрива или управлява потребители."
                  )}
                  {selectedRole === "ACCOUNTANT" && (
                    "Може да управлява фактури, плащания и финансови записи."
                  )}
                  {selectedRole === "VIEWER" && (
                    "Само за четене - може да вижда информация, но не може да прави промени."
                  )}
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Отказ
              </Button>
              <Button onClick={handleUpdateRole} disabled={isLoading}>
                {isLoading ? "Обновяване..." : "Запази промените"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
      
      {isDeleteDialogOpen ? (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Премахни потребител</DialogTitle>
              <DialogDescription>
                Сигурни ли сте, че искате да премахнете този потребител от компанията? Това действие не може да бъде отменено.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex items-center p-4 bg-amber-50 rounded-md border border-amber-200">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
              <p className="text-sm text-amber-700">
                Това ще отмени достъпа на потребителя до данните на вашата компания.
              </p>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Отказ
              </Button>
              <Button
                variant="destructive"
                onClick={handleRemoveUser}
                disabled={isLoading}
              >
                {isLoading ? "Премахване..." : "Премахни потребител"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
} 