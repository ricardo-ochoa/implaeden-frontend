"use client";

import React, { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import Webcam from "react-webcam";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { UploadCloud, Camera, Trash2 } from "lucide-react";

// Convierte base64 (webcam) a File
const dataURLtoFile = (dataurl, filename) => {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
};

export default function ProfilePictureUpload({ onChange, currentImage, isEdit }) {
  const [preview, setPreview] = useState(currentImage ?? null);
  const [showBtn, setShowBtn] = useState(true);
  const [isCompressing, setIsCompressing] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const webcamRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const processFile = async (file) => {
    if (!file) {
      setPreview(null);
      onChange?.(null);
      return;
    }

    if (file.size / 1024 / 1024 > 1) {
      setAlertMessage("Ajustando imagen...");
      setIsCompressing(true);
    } else {
      setAlertMessage("");
    }

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(compressedFile);

      onChange?.(compressedFile);
      setAlertMessage("");
    } catch (err) {
      console.error("Error al procesar la imagen:", err);
      setAlertMessage("Ocurrió un error al procesar la imagen.");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setShowBtn(true);
    processFile(file);
  };

  const handleDeleteImage = () => {
    setPreview(null);
    onChange?.(null);
    setShowBtn(false);
  };

  const handleCapture = () => {
    const imageSrc = webcamRef.current?.getScreenshot?.();
    if (imageSrc) {
      const capturedFile = dataURLtoFile(imageSrc, "captured_photo.jpg");
      processFile(capturedFile);
    }
    setCameraOpen(false);
  };

  return (
    <div className="relative mb-4 flex flex-col items-center">
      {/* Avatar */}
      <div className="relative">
        <Avatar className="h-24 w-24 ring-2 ring-[#F5F7FB] ring-offset-4 ring-offset-[#B2C6FB]">
          <AvatarImage src={preview || undefined} alt="Imagen de perfil" />
          <AvatarFallback>PF</AvatarFallback>
        </Avatar>

        {/* Delete button (solo si edit) */}
        {showBtn && currentImage && isEdit ? (
          <button
            type="button"
            onClick={handleDeleteImage}
            className="absolute -right-2 -top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background shadow hover:bg-muted"
            aria-label="Eliminar imagen"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        ) : null}
      </div>

      {/* Status */}
      {isCompressing ? (
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
          Ajustando imagen...
        </div>
      ) : null}

      {/* Alert */}
      {alertMessage && !isCompressing ? (
        <div className="mt-3 w-full max-w-sm">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{alertMessage}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {/* Buttons */}
      {!alertMessage || isCompressing ? (
        <div className="mt-3 flex gap-2">
          <Button type="button" variant="default" size="sm" asChild>
            <label className="cursor-pointer">
              <UploadCloud />
              {isEdit ? "Cambiar" : "Subir"}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileChange}
              />
            </label>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCameraOpen(true)}
          >
            <Camera />
            Tomar foto
          </Button>
        </div>
      ) : null}

      {/* Dialog cámara */}
      <Dialog open={cameraOpen} onOpenChange={setCameraOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Tomar Foto</DialogTitle>
          </DialogHeader>

          <div className="overflow-hidden rounded-lg border">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="h-auto w-full"
              videoConstraints={{ facingMode: "environment" }}
            />
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setCameraOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="w-full"
              onClick={handleCapture}
            >
              Capturar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
