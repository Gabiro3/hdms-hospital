"use client"

import { useState } from "react"
import { useNotifications, AVAILABLE_SOUNDS } from "@/hooks/use-nofitications"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Bell, Volume2 } from "lucide-react"

export default function NotificationSettings() {
  const { notificationSound, updateNotificationSound, playTestSound } = useNotifications()
  const [volume, setVolume] = useState(notificationSound.volume * 100)

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100
    setVolume(value[0])
    updateNotificationSound({ volume: newVolume })
  }

  const handleSoundToggle = (enabled: boolean) => {
    updateNotificationSound({ enabled })
  }

  const handleSoundChange = (soundName: string) => {
    updateNotificationSound({ soundName })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="mr-2 h-5 w-5" />
          Notification Sound Settings
        </CardTitle>
        <CardDescription>Customize how notification sounds work in the application</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notification-sound">Enable notification sounds</Label>
            <p className="text-sm text-muted-foreground">Play a sound when new notifications arrive</p>
          </div>
          <Switch id="notification-sound" checked={notificationSound.enabled} onCheckedChange={handleSoundToggle} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="sound-volume" className="flex items-center">
              <Volume2 className="mr-2 h-4 w-4" />
              Sound Volume
            </Label>
            <span className="text-sm text-muted-foreground">{Math.round(volume)}%</span>
          </div>
          <Slider
            id="sound-volume"
            defaultValue={[volume]}
            max={100}
            step={1}
            disabled={!notificationSound.enabled}
            onValueChange={handleVolumeChange}
          />
        </div>

        <div className="space-y-3">
          <Label>Notification Sound</Label>
          <RadioGroup
            value={notificationSound.soundName}
            onValueChange={handleSoundChange}
            disabled={!notificationSound.enabled}
            className="grid grid-cols-1 gap-2"
          >
            {AVAILABLE_SOUNDS.map((sound) => (
              <div key={sound.value} className="flex items-center space-x-2 rounded-md border p-3">
                <RadioGroupItem value={sound.value} id={sound.value} />
                <Label htmlFor={sound.value} className="flex-1 cursor-pointer">
                  {sound.name}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Button onClick={playTestSound} disabled={!notificationSound.enabled} variant="outline" className="w-full">
          Test Sound
        </Button>
      </CardContent>
    </Card>
  )
}
