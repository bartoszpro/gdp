"use client";

import React from "react";
import Map from "./components/Map";
import { SpeedInsights } from '@vercel/speed-insights/next';
import Head from "next/head";

export default function Home() {
  return (
    <div className="flex justify-center items-center h-screen bg-white">
      <Head>
        <title>U.S. GDP</title>
        <meta name="description" content="Explore U.S. GDP insights at state and county levels." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Map />
      <SpeedInsights />
    </div>
  );
}
