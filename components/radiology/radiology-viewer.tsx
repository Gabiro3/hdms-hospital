"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useHotkeys } from "react-hotkeys-hook"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Maximize,
  Share2,
  Printer,
  PanelLeftClose,
  PanelLeftOpen,
  Contrast,
  Pencil,
  Eraser,
  ImageIcon,
  Grid,
  Download,
  ChevronRight,
  ChevronLeft,
  Copy,
  Focus,
  FileText,
  RefreshCw,
  LayoutTemplate,
  Crop,
  Move,
  CircleDot,
  Square,
  HeartPulse,
  Ruler,
  Type,
  ScreenShare,
  Upload,
  Trash2,
  ArrowUpRight,
  Highlighter,
  MousePointer,
  Layers,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Moon,
  Sun,
} from "lucide-react"
import { format } from "date-fns"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { useTheme } from "next-themes"
import { v4 as uuidv4 } from "uuid"
import ImageCanvas from "./image-canvas"
import SharedStudiesDialog from "./shared-studies-dialog"
import ImageUploadDialog from "./image-upload-dialog"
import TextAnnotationDialog from "./text-annotation-dialog"
import DeleteImageDialog from "./delete-image-dialog"
import { useRadiologyState } from "./radiology-state-provider"
import { Tabs } from "@/components/ui/tabs"

interface RadiologyViewerProps {
  currentUser: any
}

export default function RadiologyViewer({ currentUser }: RadiologyViewerProps) {
  const {
    state,
    setCurrentImageIndex,
    setActiveViewboxIndex,
    setLayout,
    setViewMode,
    updateViewboxSettings,
    updateAnnotations,
    uploadImages,
    deleteImage,
  } = useRadiologyState()
  const { theme, setTheme } = useTheme()

  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showTextDialog, setShowTextDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeToolId, setActiveToolId] = useState<string>("pan")
  const [shouldReset, setShouldReset] = useState(false)
  const [textAnnotationPosition, setTextAnnotationPosition] = useState({ x: 0, y: 0 })
  const [selectedAnnotationIndex, setSelectedAnnotationIndex] = useState<number | null>(null)

  const router = useRouter()
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<any>(null)

  // Get current image and its settings
  const currentImage = state.images[state.currentImageIndex] || {
    url: "/placeholder.svg?height=800&width=800",
    annotations: [],
    viewboxSettings: {
      panOffset: { x: 0, y: 0 },
      zoom: 100,
      brightness: 100,
      contrast: 100,
      invert: false,
      rotation: 0,
      flipped: { horizontal: false, vertical: false },
    },
  }

  // Tools configuration
  const tools = [
    { id: "select", icon: MousePointer, name: "Select" },
    { id: "pan", icon: Move, name: "Pan" },
    { id: "zoom", icon: ZoomIn, name: "Zoom" },
    { id: "window", icon: Contrast, name: "Window Level" },
    { id: "draw", icon: Pencil, name: "Draw" },
    { id: "erase", icon: Eraser, name: "Erase" },
    { id: "text", icon: Type, name: "Text Annotation" },
    { id: "arrow", icon: ArrowUpRight, name: "Arrow" },
    { id: "highlight", icon: Highlighter, name: "Highlight Region" },
    { id: "measure", icon: Ruler, name: "Measure" },
    { id: "circle", icon: CircleDot, name: "Circle ROI" },
    { id: "rectangle", icon: Square, name: "Rectangle ROI" },
  ]

  // Handle tool selection
  const handleToolSelect = (toolId: string) => {
    if (toolId === "text") {
      // For text tool, we need to get the position first
      if (canvasRef.current) {
        const canvasCenter = canvasRef.current.getCanvasCenter()
        setTextAnnotationPosition(canvasCenter)
        setShowTextDialog(true)
      }
    } else {
      setActiveToolId(toolId)
      // Deselect any selected annotation when changing tools
      setSelectedAnnotationIndex(null)
    }
  }

  // Reset image transformations
  const handleReset = () => {
    updateViewboxSettings(state.currentImageIndex, {
      panOffset: { x: 0, y: 0 },
      zoom: 100,
      brightness: 100,
      contrast: 100,
      invert: false,
      rotation: 0,
      flipped: { horizontal: false, vertical: false },
    })
    setShouldReset(true)

    // Reset the flag after a short delay to allow the canvas to respond
    setTimeout(() => {
      setShouldReset(false)
    }, 100)
  }

  // Handle image inversion
  const handleInvert = () => {
    updateViewboxSettings(state.currentImageIndex, {
      invert: !currentImage.viewboxSettings.invert,
    })
  }

  // Handle image rotation
  const handleRotate = (direction: "clockwise" | "counterclockwise") => {
    const currentRotation = currentImage.viewboxSettings.rotation
    const newRotation = direction === "clockwise" ? (currentRotation + 90) % 360 : (currentRotation - 90 + 360) % 360

    updateViewboxSettings(state.currentImageIndex, {
      rotation: newRotation,
    })
  }

  // Handle image flipping
  const handleFlip = (axis: "horizontal" | "vertical") => {
    const currentFlipped = currentImage.viewboxSettings.flipped
    updateViewboxSettings(state.currentImageIndex, {
      flipped: {
        ...currentFlipped,
        [axis]: !currentFlipped[axis],
      },
    })
  }

  // Handle brightness change
  const handleBrightnessChange = (value: number) => {
    updateViewboxSettings(state.currentImageIndex, {
      brightness: value,
    })
  }

  // Handle contrast change
  const handleContrastChange = (value: number) => {
    updateViewboxSettings(state.currentImageIndex, {
      contrast: value,
    })
  }

  // Handle zoom change
  const handleZoomChange = (value: number) => {
    updateViewboxSettings(state.currentImageIndex, {
      zoom: value,
    })
  }

  // Handle keyboard shortcuts
  useHotkeys("ctrl+z", () => {
    // Undo last annotation
    if (currentImage.annotations.length > 0) {
      const newAnnotations = [...currentImage.annotations.slice(0, -1)]
      updateAnnotations(state.currentImageIndex, newAnnotations)
      toast({ title: "Undo", description: "Last annotation undone" })
    }
  })

  useHotkeys("delete", () => {
    // Delete selected annotation
    if (selectedAnnotationIndex !== null) {
      handleDeleteAnnotation(selectedAnnotationIndex)
    }
  })

  useHotkeys("r", () => handleReset())
  useHotkeys("i", () => handleInvert())
  useHotkeys("=", () => handleZoomChange(Math.min(currentImage.viewboxSettings.zoom + 10, 500)))
  useHotkeys("-", () => handleZoomChange(Math.max(currentImage.viewboxSettings.zoom - 10, 10)))
  useHotkeys("right", () => handleNextImage())
  useHotkeys("left", () => handlePrevImage())
  useHotkeys("f", () => toggleFullscreen())
  useHotkeys("d", () => setTheme(theme === "dark" ? "light" : "dark"))

  // Handle next/prev image navigation
  const handleNextImage = () => {
    if (state.currentImageIndex < state.images.length - 1) {
      setCurrentImageIndex(state.currentImageIndex + 1)
    }
  }

  const handlePrevImage = () => {
    if (state.currentImageIndex > 0) {
      setCurrentImageIndex(state.currentImageIndex - 1)
    }
  }

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (canvasContainerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch((err) => {
          console.error(`Error attempting to exit fullscreen mode: ${err.message}`)
        })
      } else {
        canvasContainerRef.current.requestFullscreen().catch((err) => {
          console.error(`Error attempting to enter fullscreen mode: ${err.message}`)
        })
      }
    }
  }

  // Handle print
  const handlePrint = () => {
    toast({
      title: "Printing",
      description: "Preparing study for printing...",
    })
  }

  // Handle download
  const handleDownload = () => {
    toast({
      title: "Downloading",
      description: "Preparing study images for download...",
    })
  }

  // Handle share
  const handleShare = () => {
    setShowShareDialog(true)
  }

  // Handle upload
  const handleUpload = () => {
    setShowUploadDialog(true)
  }

  // Handle file upload
  const handleFileUpload = useCallback(
    async (files: File[]) => {
      await uploadImages(files)
    },
    [uploadImages],
  )

  // Handle adding a text annotation
  const handleAddTextAnnotation = (text: string) => {
    const newAnnotation = {
      id: uuidv4(),
      type: "text",
      text,
      x: textAnnotationPosition.x,
      y: textAnnotationPosition.y,
      color: "#ff0000",
      fontSize: 16,
      backgroundColor: "rgba(255, 255, 255, 0.7)",
    }

    const newAnnotations = [...currentImage.annotations, newAnnotation]
    updateAnnotations(state.currentImageIndex, newAnnotations)
    setShowTextDialog(false)
    setActiveToolId("select") // Switch to select tool after adding text
  }

  // Handle annotation selection
  const handleAnnotationSelect = (index: number | null) => {
    setSelectedAnnotationIndex(index)
  }

  // Handle annotation deletion
  const handleDeleteAnnotation = (index: number) => {
    if (index >= 0 && index < currentImage.annotations.length) {
      const newAnnotations = [...currentImage.annotations.slice(0, index), ...currentImage.annotations.slice(index + 1)]
      updateAnnotations(state.currentImageIndex, newAnnotations)
      setSelectedAnnotationIndex(null)
      toast({
        title: "Annotation Deleted",
        description: "The selected annotation has been removed.",
      })
    }
  }

  // Delete all annotations for the current image
  const handleClearAllAnnotations = () => {
    if (currentImage.annotations.length > 0) {
      updateAnnotations(state.currentImageIndex, [])
      setSelectedAnnotationIndex(null)
      toast({
        title: "Annotations Cleared",
        description: "All annotations for this image have been removed.",
      })
    }
  }

  // Handle image deletion
  const handleDeleteCurrentImage = () => {
    setShowDeleteDialog(true)
  }

  // Confirm image deletion
  const confirmDeleteImage = () => {
    deleteImage(state.currentImageIndex)
    setShowDeleteDialog(false)
  }

  // Get the number of viewboxes based on the layout
  const getViewboxCount = () => {
    switch (state.layout) {
      case "1x2":
        return 2
      case "2x2":
        return 4
      default:
        return 1
    }
  }

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{state.study?.study_description}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Patient: {state.study?.patient_name || "Unknown"}</span>
              <span>•</span>
              <span>{format(new Date(state.study?.study_date), "PPP")}</span>
              <Badge variant="outline">{state.study?.modality}</Badge>
            </div>
            
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={toggleTheme}>
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Theme (D)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleUpload}>
                  <Upload className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Upload Images</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Print</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download Images</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Share Study</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={toggleFullscreen}>
                  <Maximize className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fullscreen (F)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2 p-2 border-b">
          <Tabs value={state.viewMode} onValueChange={(value) => setViewMode(value as "images" | "report" | "info")}>
            <TabsList>
              <TabsTrigger value="images">
                <ImageIcon className="mr-2 h-4 w-4" />
                Images
              </TabsTrigger>
              <TabsTrigger value="report">
                <FileText className="mr-2 h-4 w-4" />
                Report
              </TabsTrigger>
              <TabsTrigger value="info">
                <HeartPulse className="mr-2 h-4 w-4" />
                Patient Info
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <LayoutTemplate className="mr-2 h-4 w-4" />
                  Layout: {state.layout}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setLayout("1x1")}>
                  <Grid className="mr-2 h-4 w-4" />
                  1x1
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLayout("1x2")}>
                  <Grid className="mr-2 h-4 w-4" />
                  1x2
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLayout("2x2")}>
                  <Grid className="mr-2 h-4 w-4" />
                  2x2
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex-1 flex flex-row overflow-hidden">
          {/* Sidebar */}
          <div className={`border-r ${sidebarOpen ? "w-64" : "w-12"} flex flex-col transition-all`}>
            <div className="p-2 flex justify-between items-center">
              <span className={`font-medium ${sidebarOpen ? "block" : "hidden"}`}>Series</span>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="ml-auto">
                {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
              </Button>
            </div>
            <Separator />
            <div className="flex-1 overflow-auto">
              {sidebarOpen ? (
                <div className="p-2 space-y-2">
                  <Card className="hover:bg-accent transition-colors cursor-pointer overflow-hidden">
                    <CardContent className="p-2">
                      <div className="font-medium text-sm mb-1">Series 1: {state.study?.modality || "Images"}</div>
                      <div className="grid grid-cols-2 gap-1">
                        {state.images.slice(0, 8).map((img, i) => (
                          <div
                            key={i}
                            className={`aspect-square bg-muted rounded-sm overflow-hidden relative cursor-pointer ${
                              i === state.currentImageIndex ? "ring-2 ring-primary" : ""
                            }`}
                            onClick={() => setCurrentImageIndex(i)}
                          >
                            <img
                              src={img.url || "/placeholder.svg"}
                              alt={`Thumbnail ${i + 1}`}
                              className="object-cover w-full h-full"
                            />
                            <div className="absolute bottom-0 right-0 bg-background/80 text-xs px-1">{i + 1}</div>
                            {img.annotations?.length > 0 && (
                              <div className="absolute top-0 right-0 bg-primary/80 text-white text-xs px-1 rounded-bl">
                                <Layers className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {state.images.length > 8 && (
                        <div className="text-xs text-center mt-1 text-muted-foreground">
                          + {state.images.length - 8} more images
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Image actions */}
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={handleDeleteCurrentImage}
                      disabled={state.images.length <= 1}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Image
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-2">
                  {state.images.slice(0, 4).map((img, i) => (
                    <div
                      key={i}
                      className={`mb-1 aspect-square bg-muted rounded-sm overflow-hidden cursor-pointer ${
                        i === state.currentImageIndex ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => setCurrentImageIndex(i)}
                    >
                      <img
                        src={img.url || "/placeholder.svg"}
                        alt={`Thumbnail ${i + 1}`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Separator />
            {sidebarOpen && (
              <>
                <div className="p-3 bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {state.study?.patient_name?.charAt(0) || "P"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                      <p className="font-medium text-sm truncate">{state.study?.patient_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        ID: {`${state.study?.patient.id.slice(0, 4)}...${state.study?.patient.id.slice(-4)}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Study Date:</span>
                      <span className="font-medium text-foreground">
                        {format(new Date(state.study?.study_date), "MM/dd/yyyy")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Modality:</span>
                      <span className="font-medium text-foreground">{state.study?.modality}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Images:</span>
                      <span className="font-medium text-foreground">{state.images.length}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Main Viewer */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Tools */}
            <div className="border-b">
              <div className="flex items-center justify-between p-1">
                <div className="flex flex-wrap">
                  <TooltipProvider>
                    {tools.map((tool) => (
                      <Tooltip key={tool.id}>
                        <TooltipTrigger asChild>
                          <Button
                            variant={activeToolId === tool.id ? "secondary" : "ghost"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleToolSelect(tool.id)}
                          >
                            <tool.icon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{tool.name}</TooltipContent>
                      </Tooltip>
                    ))}

                    <Separator orientation="vertical" className="mx-1 h-8" />

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={currentImage.viewboxSettings.invert ? "secondary" : "ghost"}
                          size="icon"
                          className="h-8 w-8"
                          onClick={handleInvert}
                        >
                          <Contrast className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Invert (I)</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleReset}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Reset (R)</TooltipContent>
                    </Tooltip>

                    <Separator orientation="vertical" className="mx-1 h-8" />

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRotate("counterclockwise")}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Rotate Left</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRotate("clockwise")}
                        >
                          <RotateCw className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Rotate Right</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleFlip("horizontal")}
                        >
                          <FlipHorizontal className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Flip Horizontal</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleFlip("vertical")}>
                          <FlipVertical className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Flip Vertical</TooltipContent>
                    </Tooltip>

                    <Separator orientation="vertical" className="mx-1 h-8" />

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={handleClearAllAnnotations}
                          disabled={!currentImage.annotations?.length}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Clear All Annotations</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToolSelect("crop")}
                        >
                          <Crop className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Crop</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToolSelect("capture")}
                        >
                          <ScreenShare className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Capture Region</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToolSelect("copy")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy to Clipboard</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToolSelect("focus")}
                        >
                          <Focus className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Focus Region</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleZoomChange(Math.max(currentImage.viewboxSettings.zoom - 10, 10))}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-xs w-12 text-center">{currentImage.viewboxSettings.zoom}%</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleZoomChange(Math.min(currentImage.viewboxSettings.zoom + 10, 500))}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>

                  <Separator orientation="vertical" className="h-8" />

                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handlePrevImage}
                      disabled={state.currentImageIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs w-16 text-center">
                      {state.currentImageIndex + 1} / {state.images.length}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleNextImage}
                      disabled={state.currentImageIndex === state.images.length - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Image Canvas */}
            <div ref={canvasContainerRef} className="flex-1 overflow-hidden bg-black relative">
              <ImageCanvas
                ref={canvasRef}
                imageUrl={currentImage.url}
                zoom={currentImage.viewboxSettings.zoom}
                brightness={currentImage.viewboxSettings.brightness}
                contrast={currentImage.viewboxSettings.contrast}
                invert={currentImage.viewboxSettings.invert}
                rotation={currentImage.viewboxSettings.rotation}
                flipped={currentImage.viewboxSettings.flipped}
                activeTool={activeToolId}
                shouldReset={shouldReset}
                layout={state.layout}
                annotations={currentImage.annotations || []}
                onAnnotationsChange={(newAnnotations) => updateAnnotations(state.currentImageIndex, newAnnotations)}
                selectedAnnotationIndex={selectedAnnotationIndex}
                onAnnotationSelect={handleAnnotationSelect}
                activeViewboxIndex={state.activeViewboxIndex}
                onViewboxSelect={setActiveViewboxIndex}
                viewboxCount={getViewboxCount()}
                onPanOffsetChange={(offset) => {
                  updateViewboxSettings(state.currentImageIndex, {
                    panOffset: offset,
                  })
                }}
              />

              {/* Image adjustment controls */}
              <div className="absolute right-4 top-4 bg-background border rounded-lg shadow-md p-3 w-52 space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Brightness</span>
                    <span>{currentImage.viewboxSettings.brightness}%</span>
                  </div>
                  <Slider
                    value={[currentImage.viewboxSettings.brightness]}
                    min={0}
                    max={200}
                    step={1}
                    onValueChange={(value) => handleBrightnessChange(value[0])}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Contrast</span>
                    <span>{currentImage.viewboxSettings.contrast}%</span>
                  </div>
                  <Slider
                    value={[currentImage.viewboxSettings.contrast]}
                    min={0}
                    max={200}
                    step={1}
                    onValueChange={(value) => handleContrastChange(value[0])}
                  />
                </div>
              </div>

              {/* Selected annotation info */}
              {selectedAnnotationIndex !== null && (
                <div className="absolute left-4 top-4 bg-background border rounded-lg shadow-md p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Selected Annotation</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleDeleteAnnotation(selectedAnnotationIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {currentImage.annotations?.[selectedAnnotationIndex]?.type === "text" ? (
                      <span>Text: {currentImage.annotations[selectedAnnotationIndex]?.text}</span>
                    ) : (
                      <span>Type: {currentImage.annotations[selectedAnnotationIndex]?.type}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <SharedStudiesDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        study={state.study}
        currentUser={currentUser}
      />

      <ImageUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onUpload={handleFileUpload}
        isUploading={state.isLoading}
      />

      <TextAnnotationDialog open={showTextDialog} onOpenChange={setShowTextDialog} onSave={handleAddTextAnnotation} />

      <DeleteImageDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDeleteImage}
        imageIndex={state.currentImageIndex + 1}
        totalImages={state.images.length}
      />
    </div>
  )
}
