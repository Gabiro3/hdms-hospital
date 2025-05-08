"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useHotkeys } from "react-hotkeys-hook"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
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
} from "lucide-react"
import { format } from "date-fns"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import ImageCanvas from "./image-canvas"
import RadiologyReport from "./radiology-report"
import SharedStudiesDialog from "./shared-studies-dialog"
import ImageUploadDialog from "./image-upload-dialog"
import TextAnnotationDialog from "./text-annotation-dialog"
import { uploadRadiologyImage } from "@/services/radiology-service"

interface RadiologyViewerProps {
  study: any
  currentUser: any
}

export default function RadiologyViewer({ study, currentUser }: RadiologyViewerProps) {
  const [activeTab, setActiveTab] = useState("images")
  const [selectedLayout, setSelectedLayout] = useState("1x1")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeToolId, setActiveToolId] = useState<string>("pan")
  const [zoom, setZoom] = useState(100)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [invert, setInvert] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showTextDialog, setShowTextDialog] = useState(false)
  const [shouldReset, setShouldReset] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [activeViewboxIndex, setActiveViewboxIndex] = useState(0)
  const [rotation, setRotation] = useState(0)
  const [flipped, setFlipped] = useState({ horizontal: false, vertical: false })
  const [textAnnotationPosition, setTextAnnotationPosition] = useState({ x: 0, y: 0 })
  const [images, setImages] = useState<string[]>([
    "/placeholder.svg?height=800&width=800",
    "/placeholder.svg?height=800&width=800",
    "/placeholder.svg?height=800&width=800",
    "/placeholder.svg?height=800&width=800",
  ])
  const [isUploading, setIsUploading] = useState(false)
  const [annotations, setAnnotations] = useState<Record<string, any[]>>({})
  const [selectedAnnotationIndex, setSelectedAnnotationIndex] = useState<number | null>(null)
  const router = useRouter()

  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<any>(null)

  // Initialize annotations for each image
  useEffect(() => {
    const initialAnnotations: Record<string, any[]> = {}
    images.forEach((img, index) => {
      initialAnnotations[index.toString()] = []
    })
    setAnnotations(initialAnnotations)
  }, [])

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
    setBrightness(100)
    setContrast(100)
    setZoom(100)
    setInvert(false)
    setRotation(0)
    setFlipped({ horizontal: false, vertical: false })
    setShouldReset(true)

    // Reset the flag after a short delay to allow the canvas to respond
    setTimeout(() => {
      setShouldReset(false)
    }, 100)
  }

  // Handle image inversion
  const handleInvert = () => {
    setInvert(!invert)
  }

  // Handle image rotation
  const handleRotate = (direction: "clockwise" | "counterclockwise") => {
    setRotation((prev) => {
      const newRotation = direction === "clockwise" ? (prev + 90) % 360 : (prev - 90 + 360) % 360
      return newRotation
    })
  }

  // Handle image flipping
  const handleFlip = (axis: "horizontal" | "vertical") => {
    setFlipped((prev) => ({
      ...prev,
      [axis]: !prev[axis],
    }))
  }

  // Handle keyboard shortcuts
  useHotkeys("ctrl+z", () => {
    // Undo last annotation
    const imageKey = currentImageIndex.toString()
    if (annotations[imageKey]?.length > 0) {
      const newAnnotations = { ...annotations }
      newAnnotations[imageKey] = [...newAnnotations[imageKey].slice(0, -1)]
      setAnnotations(newAnnotations)
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
  useHotkeys("=", () => setZoom((prev) => Math.min(prev + 10, 500)))
  useHotkeys("-", () => setZoom((prev) => Math.max(prev - 10, 10)))
  useHotkeys("right", () => handleNextImage())
  useHotkeys("left", () => handlePrevImage())
  useHotkeys("f", () => toggleFullscreen())

  // Handle next/prev image navigation
  const handleNextImage = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex((prev) => prev + 1)
    }
  }

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex((prev) => prev - 1)
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

  // Handle layout change
  const handleLayoutChange = (layout: string) => {
    setSelectedLayout(layout)
    // Reset active viewbox to 0 when changing layout
    setActiveViewboxIndex(0)
  }

  // Handle file upload
  const handleFileUpload = useCallback(
    async (files: File[]) => {
      if (!study.id) {
        toast({
          title: "Upload Error",
          description: "Study ID is missing. Cannot upload images.",
          variant: "destructive",
        })
        return
      }

      setIsUploading(true)
      const newImages = [...images]

      try {
        for (const file of files) {
          // Check file type
          const fileType = file.type.toLowerCase()
          const isValidType =
            fileType.includes("image/") || fileType.includes("dicom") || file.name.toLowerCase().endsWith(".dcm")

          if (!isValidType) {
            toast({
              title: "Invalid File Type",
              description: `File ${file.name} is not a supported image format.`,
              variant: "destructive",
            })
            continue
          }

          // Create object URL for immediate display
          const objectUrl = URL.createObjectURL(file)
          newImages.push(objectUrl)

          // Initialize annotations for the new image
          const newAnnotations = { ...annotations }
          newAnnotations[newImages.length - 1] = []
          setAnnotations(newAnnotations)

          // Upload to server
          const { imageUrl, error } = await uploadRadiologyImage(file, study.id)

          if (error) {
            toast({
              title: "Upload Failed",
              description: `Failed to upload ${file.name}: ${error}`,
              variant: "destructive",
            })
            // Remove the object URL if upload failed
            const index = newImages.indexOf(objectUrl)
            if (index !== -1) {
              newImages.splice(index, 1)
              // Also remove annotations for this image
              const updatedAnnotations = { ...newAnnotations }
              delete updatedAnnotations[index.toString()]
              setAnnotations(updatedAnnotations)
            }
          } else if (imageUrl) {
            // Replace object URL with actual URL
            const index = newImages.indexOf(objectUrl)
            if (index !== -1) {
              newImages[index] = imageUrl
            }

            toast({
              title: "Upload Successful",
              description: `${file.name} uploaded successfully.`,
            })
          }
        }

        setImages(newImages)
        // Navigate to the newly added image
        setCurrentImageIndex(newImages.length - 1)
      } catch (error) {
        console.error("Error uploading files:", error)
        toast({
          title: "Upload Error",
          description: "An unexpected error occurred during upload.",
          variant: "destructive",
        })
      } finally {
        setIsUploading(false)
        setShowUploadDialog(false)
      }
    },
    [study.id, images, annotations],
  )

  // Handle adding a text annotation
  const handleAddTextAnnotation = (text: string) => {
    const imageKey = currentImageIndex.toString()
    const newAnnotation = {
      type: "text",
      text,
      x: textAnnotationPosition.x,
      y: textAnnotationPosition.y,
      color: "#ff0000",
      fontSize: 16,
      backgroundColor: "rgba(255, 255, 255, 0.7)",
    }

    const newAnnotations = { ...annotations }
    if (!newAnnotations[imageKey]) {
      newAnnotations[imageKey] = []
    }
    newAnnotations[imageKey] = [...newAnnotations[imageKey], newAnnotation]
    setAnnotations(newAnnotations)
    setShowTextDialog(false)
    setActiveToolId("select") // Switch to select tool after adding text
  }

  // Handle annotation selection
  const handleAnnotationSelect = (index: number | null) => {
    setSelectedAnnotationIndex(index)
  }

  // Handle annotation deletion
  const handleDeleteAnnotation = (index: number) => {
    const imageKey = currentImageIndex.toString()
    if (annotations[imageKey] && index >= 0 && index < annotations[imageKey].length) {
      const newAnnotations = { ...annotations }
      newAnnotations[imageKey] = [
        ...newAnnotations[imageKey].slice(0, index),
        ...newAnnotations[imageKey].slice(index + 1),
      ]
      setAnnotations(newAnnotations)
      setSelectedAnnotationIndex(null)
      toast({
        title: "Annotation Deleted",
        description: "The selected annotation has been removed.",
      })
    }
  }

  // Handle viewbox selection in multi-image layouts
  const handleViewboxSelect = (index: number) => {
    setActiveViewboxIndex(index)
  }

  // Get the number of viewboxes based on the layout
  const getViewboxCount = () => {
    switch (selectedLayout) {
      case "1x2":
        return 2
      case "2x2":
        return 4
      default:
        return 1
    }
  }

  // Delete all annotations for the current image
  const handleClearAllAnnotations = () => {
    const imageKey = currentImageIndex.toString()
    if (annotations[imageKey]?.length > 0) {
      const newAnnotations = { ...annotations }
      newAnnotations[imageKey] = []
      setAnnotations(newAnnotations)
      setSelectedAnnotationIndex(null)
      toast({
        title: "Annotations Cleared",
        description: "All annotations for this image have been removed.",
      })
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{study.study_description}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Patient: {study.patient_name || "Unknown"}</span>
              <span>•</span>
              <span>{format(new Date(study.study_date), "PPP")}</span>
              <Badge variant="outline">{study.modality}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2">
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

          {activeTab === "images" && (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <LayoutTemplate className="mr-2 h-4 w-4" />
                    Layout: {selectedLayout}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleLayoutChange("1x1")}>
                    <Grid className="mr-2 h-4 w-4" />
                    1x1
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleLayoutChange("1x2")}>
                    <Grid className="mr-2 h-4 w-4" />
                    1x2
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleLayoutChange("2x2")}>
                    <Grid className="mr-2 h-4 w-4" />
                    2x2
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        <TabsContent value="images" className="flex-1 flex flex-row mt-0 overflow-hidden">
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
                      <div className="font-medium text-sm mb-1">Series 1: {study.modality || "Images"}</div>
                      <div className="grid grid-cols-2 gap-1">
                        {images.slice(0, 8).map((img, i) => (
                          <div
                            key={i}
                            className={`aspect-square bg-muted rounded-sm overflow-hidden relative cursor-pointer ${
                              i === currentImageIndex ? "ring-2 ring-primary" : ""
                            }`}
                            onClick={() => setCurrentImageIndex(i)}
                          >
                            <img
                              src={img || "/placeholder.svg"}
                              alt={`Thumbnail ${i + 1}`}
                              className="object-cover w-full h-full"
                            />
                            <div className="absolute bottom-0 right-0 bg-background/80 text-xs px-1">{i + 1}</div>
                            {annotations[i.toString()]?.length > 0 && (
                              <div className="absolute top-0 right-0 bg-primary/80 text-white text-xs px-1 rounded-bl">
                                <Layers className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {images.length > 8 && (
                        <div className="text-xs text-center mt-1 text-muted-foreground">
                          + {images.length - 8} more images
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="p-2">
                  {images.slice(0, 4).map((img, i) => (
                    <div
                      key={i}
                      className={`mb-1 aspect-square bg-muted rounded-sm overflow-hidden cursor-pointer ${
                        i === currentImageIndex ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => setCurrentImageIndex(i)}
                    >
                      <img
                        src={img || "/placeholder.svg"}
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
                        {study.patient_name?.charAt(0) || "P"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                      <p className="font-medium text-sm truncate">{study.patient_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground truncate">ID: {study.patient_id || "Unknown"}</p>
                    </div>
                  </div>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Study Date:</span>
                      <span className="font-medium text-foreground">
                        {format(new Date(study.study_date), "MM/dd/yyyy")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Modality:</span>
                      <span className="font-medium text-foreground">{study.modality}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Images:</span>
                      <span className="font-medium text-foreground">{images.length}</span>
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
                          variant={invert ? "secondary" : "ghost"}
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
                      <TooltipTrigger asChild></TooltipTrigger>
                      <TooltipContent>Clear All Annotations</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={handleClearAllAnnotations}
                          disabled={!annotations[currentImageIndex.toString()]?.length}
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
                      onClick={() => setZoom(Math.max(zoom - 10, 10))}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-xs w-12 text-center">{zoom}%</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setZoom(Math.min(zoom + 10, 500))}
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
                      disabled={currentImageIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs w-16 text-center">
                      {currentImageIndex + 1} / {images.length}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleNextImage}
                      disabled={currentImageIndex === images.length - 1}
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
                imageUrl={images[currentImageIndex]}
                zoom={zoom}
                brightness={brightness}
                contrast={contrast}
                invert={invert}
                rotation={rotation}
                flipped={flipped}
                activeTool={activeToolId}
                shouldReset={shouldReset}
                layout={selectedLayout}
                annotations={annotations[currentImageIndex.toString()] || []}
                onAnnotationsChange={(newAnnotations) => {
                  const updatedAnnotations = { ...annotations }
                  updatedAnnotations[currentImageIndex.toString()] = newAnnotations
                  setAnnotations(updatedAnnotations)
                }}
                selectedAnnotationIndex={selectedAnnotationIndex}
                onAnnotationSelect={handleAnnotationSelect}
                activeViewboxIndex={activeViewboxIndex}
                onViewboxSelect={handleViewboxSelect}
                viewboxCount={getViewboxCount()}
              />

              {/* Image adjustment controls */}
              <div className="absolute right-4 top-4 bg-background border rounded-lg shadow-md p-3 w-52 space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Brightness</span>
                    <span>{brightness}%</span>
                  </div>
                  <Slider
                    value={[brightness]}
                    min={0}
                    max={200}
                    step={1}
                    onValueChange={(value) => setBrightness(value[0])}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Contrast</span>
                    <span>{contrast}%</span>
                  </div>
                  <Slider
                    value={[contrast]}
                    min={0}
                    max={200}
                    step={1}
                    onValueChange={(value) => setContrast(value[0])}
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
                    {annotations[currentImageIndex.toString()]?.[selectedAnnotationIndex]?.type === "text" ? (
                      <span>Text: {annotations[currentImageIndex.toString()]?.[selectedAnnotationIndex]?.text}</span>
                    ) : (
                      <span>Type: {annotations[currentImageIndex.toString()]?.[selectedAnnotationIndex]?.type}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="report" className="flex-1 mt-0">
          <RadiologyReport study={study} />
        </TabsContent>

        <TabsContent value="info" className="flex-1 mt-0 p-4">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Patient Information</h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-1">
                        <span className="text-muted-foreground text-sm">Name:</span>
                        <span className="col-span-2 font-medium">{study.patient_name || "Unknown"}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <span className="text-muted-foreground text-sm">Patient ID:</span>
                        <span className="col-span-2 font-medium">{study.patient_id || "Unknown"}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <span className="text-muted-foreground text-sm">Birth Date:</span>
                        <span className="col-span-2 font-medium">Not Available</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <span className="text-muted-foreground text-sm">Gender:</span>
                        <span className="col-span-2 font-medium">Not Available</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Study Information</h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-1">
                        <span className="text-muted-foreground text-sm">Study Date:</span>
                        <span className="col-span-2 font-medium">{format(new Date(study.study_date), "PPP")}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <span className="text-muted-foreground text-sm">Accession #:</span>
                        <span className="col-span-2 font-medium">{study.accession_number || "Not Available"}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <span className="text-muted-foreground text-sm">Modality:</span>
                        <span className="col-span-2 font-medium">{study.modality}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <span className="text-muted-foreground text-sm">Referring Physician:</span>
                        <span className="col-span-2 font-medium">{study.referring_physician || "Not Available"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Clinical Information</h3>
                  <p className="text-sm">{study.clinical_information || "No clinical information provided."}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <SharedStudiesDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        study={study}
        currentUser={currentUser}
      />

      <ImageUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onUpload={handleFileUpload}
        isUploading={isUploading}
      />

      <TextAnnotationDialog open={showTextDialog} onOpenChange={setShowTextDialog} onSave={handleAddTextAnnotation} />
    </div>
  )
}
