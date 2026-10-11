"use client";

import { RechartsAdapter } from "./RechartsAdapter";

export interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number; // Allow multiple series
}

export interface ChartProps {
  data: ChartData[];
  series?: { dataKey: string; color: string; name?: string }[];
  height?: number;
  hideLegend?: boolean;
}

/**
 * ChartAdapter serves as the primary abstraction for all visualizations.
 * 
 * If we ever switch from Recharts to ECharts, Nivo, or Chart.js, 
 * we only need to update the implementation inside this file, leaving 
 * all Analytics components completely untouched.
 */
export const LineChart = (props: ChartProps) => <RechartsAdapter type="line" {...props} />;
export const BarChart = (props: ChartProps) => <RechartsAdapter type="bar" {...props} />;
export const AreaChart = (props: ChartProps) => <RechartsAdapter type="area" {...props} />;
export const DonutChart = (props: ChartProps) => <RechartsAdapter type="donut" {...props} />;
