"use client";

import { 
  LineChart as RechartsLine, 
  BarChart as RechartsBar, 
  AreaChart as RechartsArea, 
  PieChart as RechartsPie,
  Line, Bar, Area, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

import { ChartProps } from "./ChartAdapter";

const DEFAULT_SERIES = [{ dataKey: "value", color: "var(--chart-1)" }];
const PAHCHAAN_PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function RechartsAdapter({ type, data, series = DEFAULT_SERIES, height = 300, hideLegend }: ChartProps & { type: "line" | "bar" | "area" | "donut" }) {
  
  const commonProps = {
    data,
    margin: { top: 10, right: 10, left: -20, bottom: 0 }
  };

  const CustomTooltip = ({ active, payload, label }: {active?:boolean;payload?:Array<{color?:string;name?:string;value?:number|string}>;label?:string|number}) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover text-popover-foreground border border-border shadow-lg rounded-lg p-2 min-w-[100px] animate-in fade-in zoom-in-95 duration-200">
          <p className="text-[11px] text-muted-foreground font-medium mb-1.5 border-b border-border/50 pb-1.5">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: {color?:string;name?:string;value?:number|string}, index: number) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                  <span className="text-[12px] font-medium">{entry.name}</span>
                </div>
                <span className="text-[12px] font-bold">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderTooltip = () => (
    <Tooltip 
      content={<CustomTooltip />}
      cursor={{ fill: "var(--muted)", opacity: 0.4, strokeWidth: 1, strokeDasharray: "3 3" }}
    />
  );

  const renderAxes = () => (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
      <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
      <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} dx={-10} allowDecimals={false} />
    </>
  );

  if (type === "line") {
    return (
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <RechartsLine {...commonProps}>
            {renderAxes()}
            {renderTooltip()}
            {!hideLegend && <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />}
            {series.map((s, i) => (
              <Line key={s.dataKey} type="monotone" dataKey={s.dataKey} stroke={s.color || PAHCHAAN_PALETTE[i % 5]} strokeWidth={2} dot={{ r: 4, fill: "var(--background)", strokeWidth: 2 }} activeDot={{ r: 6 }} name={s.name} />
            ))}
          </RechartsLine>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === "bar") {
    return (
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <RechartsBar {...commonProps}>
            {renderAxes()}
            {renderTooltip()}
            {!hideLegend && <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />}
            {series.map((s, i) => (
              <Bar key={s.dataKey} dataKey={s.dataKey} fill={s.color || PAHCHAAN_PALETTE[i % 5]} radius={[4, 4, 0, 0]} name={s.name} maxBarSize={40} />
            ))}
          </RechartsBar>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === "area") {
    return (
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <RechartsArea {...commonProps}>
            {renderAxes()}
            {renderTooltip()}
            {!hideLegend && <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />}
            {series.map((s, i) => (
              <Area key={s.dataKey} type="monotone" dataKey={s.dataKey} fill={s.color || PAHCHAAN_PALETTE[i % 5]} stroke={s.color || PAHCHAAN_PALETTE[i % 5]} fillOpacity={0.2} name={s.name} />
            ))}
          </RechartsArea>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === "donut") {
    return (
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <RechartsPie>
            {renderTooltip()}
            {!hideLegend && <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />}
            <Pie
              data={data}
              innerRadius="60%"
              outerRadius="80%"
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PAHCHAAN_PALETTE[index % PAHCHAAN_PALETTE.length]} />
              ))}
            </Pie>
          </RechartsPie>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
}
