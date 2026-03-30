"use client";
import { Search } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { getColors } from "./(Color Manager)/useColors";

export type Item = {
  id: number;
  name?: string;
  batchname?: string;
};

function Filter({
  data,
  setFilteredData,
}: {
  data: Item[];
  setFilteredData: any;
}) {
  const [search, setSearch] = useState("");
  const Colors = getColors();

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter((item: Item) => {
      const value = item.name ?? item.batchname ?? "";
      return value.toLowerCase().includes(search.toLowerCase());
    });
  }, [data, search]);
  useEffect(() => {
    setFilteredData(filteredData);
  }, [filteredData, setFilteredData]);

  return (
    <div className="w-full flex">
      <div className="relative mb-3 w-1/3">
        <Search
          size={16}
          className={`absolute left-3 top-1/2 -translate-y-1/2 ${Colors.text.special}`}
        />
        <input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full pl-9 pr-3 py-2 ${Colors.background.secondary} ${Colors.text.primary} rounded-lg outline-none focus:ring-1 focus:ring-primaryBlue`}
        />
      </div>
    </div>
  );
}

export default Filter;


