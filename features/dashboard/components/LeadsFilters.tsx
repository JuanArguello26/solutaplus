"use client";

import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { LEAD_STATUS_OPTIONS } from "@/constants/lead-status";
import { CITIES } from "@/constants/cities";
import type { LeadListFilters } from "../types/leads";

interface ServiceOption {
  id: string;
  name: string;
}

interface LeadsFiltersProps {
  filters: LeadListFilters;
  services: ServiceOption[];
  onChange: (partial: Partial<LeadListFilters>) => void;
}

export function LeadsFilters({ filters, services, onChange }: LeadsFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search ?? "");

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    onChange({ search: searchInput || undefined, page: 1 });
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 md:flex-row md:items-end md:flex-wrap">
      <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px]">
        <Input
          label="Buscar"
          name="search"
          placeholder="Nombre, teléfono o correo"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
      </form>

      <div className="min-w-[180px]">
        <Select
          label="Estado"
          name="status"
          placeholder="Todos"
          options={LEAD_STATUS_OPTIONS}
          value={filters.status ?? ""}
          onChange={(event) =>
            onChange({
              status: (event.target.value || undefined) as LeadListFilters["status"],
              page: 1,
            })
          }
        />
      </div>

      <div className="min-w-[180px]">
        <Select
          label="Servicio"
          name="serviceId"
          placeholder="Todos"
          options={services.map((service) => ({
            value: service.id,
            label: service.name,
          }))}
          value={filters.serviceId ?? ""}
          onChange={(event) =>
            onChange({ serviceId: event.target.value || undefined, page: 1 })
          }
        />
      </div>

      <div className="min-w-[180px]">
        <Select
          label="Ciudad"
          name="city"
          placeholder="Todas"
          options={CITIES.map((city) => ({ value: city, label: city }))}
          value={filters.city ?? ""}
          onChange={(event) =>
            onChange({ city: event.target.value || undefined, page: 1 })
          }
        />
      </div>
    </div>
  );
}
