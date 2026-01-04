'use client';

import React from "react";
import { Box, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Add } from "@mui/icons-material";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { List, LayoutGrid } from "lucide-react";

export default function HomeActions({
  searchTerm,
  setSearchTerm,
  onAddPatient,
  viewMode,
  setViewMode,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box
      className="flex gap-4 mb-6 justify-between w-full items-center"
      sx={{ flexDirection: "row" }}
    >
      <Input
        placeholder="Buscar por nombre, teléfono o email"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-[500px] rounded-md"
      />

      <Box className="flex items-center">
        <Button onClick={onAddPatient} className="font-semibold mr-6">
          <Add />
          {isMobile ? "Nuevo" : "Agregar nuevo paciente"}
        </Button>

        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(val) => val && setViewMode(val)}
          className="border rounded-lg p-0.5 bg-background"
        >
          <ToggleGroupItem value="table" aria-label="table view">
            <List className="h-4 w-4" />
          </ToggleGroupItem>

          <ToggleGroupItem value="cards" aria-label="cards view">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </Box>
    </Box>
  );
}
