import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useCreateLocker, useAllLockers, useAllKeys } from "@/services/admin";
import { useFloors } from "@/services/bookings";
import { AxiosError } from "axios";

interface CreateLockerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const floorLockerNumberFormat = {
  "2": "L2W",
  "3": "DL3",
  "4": "DL4",
  "6": "DL6",
  "7": "DL7",
  "8": "DL8",
  "9": "DL9",
  "10": "DL10",
  "10 East": "DL10E",
  "11": "DL11",
  "11 East": "DL11E",
  "13 East": "DL13E",
}

const CreateLockerDialog = ({ isOpen, onOpenChange }: CreateLockerDialogProps) => {
  const [lockerNumber, setLockerNumber] = useState("");
  const [floorId, setFloorId] = useState("");
  const [keyNumber, setKeyNumber] = useState("");
  const [location, setLocation] = useState("");
  const [xCoordinate, setXCoordinate] = useState("");
  const [yCoordinate, setYCoordinate] = useState("");
  const [lockerNumberError, setLockerNumberError] = useState("");
  const [keyNumberError, setKeyNumberError] = useState("");

  const { mutate: createLocker, isPending } = useCreateLocker();
  const { data: floorsData = [], isLoading: floorsLoading } = useFloors();
  const { data: lockersData = [] } = useAllLockers();
  const { data: keysData = [] } = useAllKeys();

  const selectedFloor = floorsData.find(f => f.floor_id === floorId);
  const floorNumber = selectedFloor?.floor_number;
  const lockerPrefix = floorNumber ? floorLockerNumberFormat[floorNumber as keyof typeof floorLockerNumberFormat] : null;

  useEffect(() => {
    if (isOpen) {
      setLockerNumber("");
      setFloorId("");
      setKeyNumber("");
      setLocation("");
      setXCoordinate("");
      setYCoordinate("");
      setLockerNumberError("");
      setKeyNumberError("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (lockerPrefix) {
      setLockerNumber(`${lockerPrefix}-`);
      setLockerNumberError("");
    } else {
      setLockerNumber("");
      setLockerNumberError("");
    }
  }, [lockerPrefix]);

  useEffect(() => {
    if (!lockerPrefix || !floorId) {
      setLockerNumberError("");
      return;
    }

    const validateLockerNumber = () => {
      const prefix = `${lockerPrefix}-`;

      if (lockerNumber === prefix) {
        setLockerNumberError("");
        return;
      }

      const lockerExists = lockersData.some(
        locker => locker.locker_number === lockerNumber.trim() && locker.floor_id === floorId
      );
      
      if (lockerExists) {
        setLockerNumberError("A locker with this number already exists on this floor");
      } else if (lockerNumber.length > prefix.length) {
        setLockerNumberError("");
      }
    };

    const timeoutId = setTimeout(validateLockerNumber, 300);
    return () => clearTimeout(timeoutId);
  }, [lockerNumber, floorId, lockerPrefix, lockersData]);

  useEffect(() => {
    if (!keyNumber.trim()) {
      setKeyNumberError("");
      return;
    }

    const validateKeyNumber = () => {
      const keyExists = keysData.some(
        (key) => key.key_number === keyNumber.trim()
      );
      
      if (keyExists) {
        setKeyNumberError("A key with this number already exists");
      } else {
        setKeyNumberError("");
      }
    };

    const timeoutId = setTimeout(validateKeyNumber, 300);
    return () => clearTimeout(timeoutId);
  }, [keyNumber, keysData]);

  const handleLockerNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    if (lockerPrefix) {
      const prefix = `${lockerPrefix}-`;

      if (!newValue.startsWith(prefix)) {
        setLockerNumber(prefix);
        return;
      }
      
      setLockerNumber(newValue);
    } else {
      setLockerNumber(newValue);
    }
  };

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();

    if (!floorId) {
      toast.error("Please select a floor");
      return;
    }

    if (!lockerNumber.trim() || lockerNumber === `${lockerPrefix}-`) {
      toast.error("Please enter a complete locker number");
      return;
    }

    if (lockerNumberError) {
      toast.error("Please fix the locker number error before submitting");
      return;
    }

    if (!keyNumber.trim()) {
      toast.error("Key number is required");
      return;
    }

    if (keyNumberError) {
      toast.error("Please fix the key number error before submitting");
      return;
    }

    const x = xCoordinate ? parseInt(xCoordinate) : undefined;
    const y = yCoordinate ? parseInt(yCoordinate) : undefined;

    if (xCoordinate && isNaN(x as number)) {
      toast.error("X coordinate must be a number");
      return;
    }

    if (yCoordinate && isNaN(y as number)) {
      toast.error("Y coordinate must be a number");
      return;
    }

    createLocker(
      {
        lockerNumber: lockerNumber.trim(),
        floorId,
        keyNumber: keyNumber.trim(),
        location: location.trim() || undefined,
        x_coordinate: x,
        y_coordinate: y,
      },
      {
        onSuccess: () => {
          toast.success("Locker created successfully");
          onOpenChange(false);
        },
        onError: (error: Error) => {
          const axiosError = error as AxiosError<{ detail: string }>;
          toast.error(axiosError?.response?.data?.detail || "Failed to create locker");
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Locker</DialogTitle>
          <DialogDescription>
            Add a new locker with its key
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="floor">
              Floor <span className="text-error">*</span>
            </Label>
            <Select
              value={floorId}
              onValueChange={setFloorId}
              disabled={isPending || floorsLoading}
            >
              <SelectTrigger id="floor">
                <SelectValue placeholder="Select a floor first" />
              </SelectTrigger>
              <SelectContent>
                {floorsData.map((floor) => (
                  <SelectItem key={floor.floor_id} value={floor.floor_id}>
                    Floor {floor.floor_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lockerNumber">
              Locker Number <span className="text-error">*</span>
            </Label>
            <Input
              id="lockerNumber"
              placeholder={lockerPrefix ? `${lockerPrefix}-01-01` : "Select a floor first"}
              value={lockerNumber}
              onChange={handleLockerNumberChange}
              disabled={isPending || !floorId}
            />
            {lockerNumberError && (
              <p className="text-xs text-error">{lockerNumberError}</p>
            )}
            {!lockerNumberError && lockerPrefix && lockerNumber.length > `${lockerPrefix}-`.length && (
              <p className="text-xs text-success">✓ Locker number is available</p>
            )}
            {!lockerNumberError && !lockerPrefix && (
              <p className="text-xs text-grey">
                e.g. {lockerPrefix ? `${lockerPrefix}-01-01` : "Select a floor to see format"}
              </p>
            )}
            {!lockerNumberError && lockerPrefix && lockerNumber === `${lockerPrefix}-` && (
              <p className="text-xs text-grey">
                e.g. {lockerPrefix}-01-01
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="keyNumber">
              Key Number <span className="text-error">*</span>
            </Label>
            <Input
              id="keyNumber"
              placeholder="e.g., AA123"
              value={keyNumber}
              onChange={(e) => setKeyNumber(e.target.value)}
              disabled={isPending}
            />
            {keyNumberError && (
              <p className="text-xs text-error">{keyNumberError}</p>
            )}
            {!keyNumberError && keyNumber.trim().length > 0 && (
              <p className="text-xs text-success">✓ Key number is available</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location <span className="font-normal text-grey">(optional)</span></Label>
            <Input
              id="location"
              placeholder="e.g., Near elevator"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="xCoordinate">X Coordinate <span className="font-normal text-grey">(optional)</span></Label>
              <Input
                id="xCoordinate"
                type="number"
                placeholder="0"
                value={xCoordinate}
                onChange={(e) => setXCoordinate(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="yCoordinate">Y Coordinate <span className="font-normal text-grey">(optional)</span></Label>
              <Input
                id="yCoordinate"
                type="number"
                placeholder="0"
                value={yCoordinate}
                onChange={(e) => setYCoordinate(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="destructive"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !!lockerNumberError || !!keyNumberError}
              className="flex-1"
            >
              {isPending ? "Creating..." : "Confirm"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateLockerDialog;
