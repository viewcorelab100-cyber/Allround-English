"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronDown } from "lucide-react";

// --- Data ---
const sections = [
  {
    id: 1,
    title: "01. 교육은 재능이 아닙니다",
    text: `교육은 재능으로 만들어지는 결과가 아닙니다.
끝까지 걷는 사람만이 도달할 수 있는 지점이 있을 뿐입니다.`,
    imageUrl: "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?q=80&w=2074&auto=format&fit=crop", // Marathon/Run start
    imageAlt: "끝이 보이지 않는 긴 길",
  },
  {
    id: 2,
    title: "02. 혼자 견디지 않게, 함께 걷는 시간",
    text: `처음 길에 들어선 아이는 방향을 알지 못합니다. 어디에 발을 디뎌야 하는지, 어디서 멈춰야 하는지도 모릅니다. 이 시기에는 아이 혼자 감당하게 두지 않습니다.
선생님은 아이의 옆에 서서 같은 속도로 걸으며 넘어지는 지점을 함께 확인하고, 다시 일어나는 방법을 반복해서 보여줍니다.
기초란 혼자 견디게 두는 시간이 아니라, 함께 견디는 시간을 통해 만들어지는 힘이라고 믿기 때문입니다.`,
    imageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1974&auto=format&fit=crop", // Walking together feet
    imageAlt: "발걸음을 맞추는 두 사람",
  },
  {
    id: 3,
    title: "03. 스스로 속도를 조절하는 균형",
    text: `어느 순간부터 아이의 발걸음은 흔들리지 않기 시작합니다. 같은 길을 여러 번 지나며 자신만의 균형을 만들고, 스스로 속도를 조절하는 법을 익힙니다.
이때부터 선생님의 역할은 달라집니다. 앞서 가는 대신, 더 멀리 이어진 길을 보여주는 사람이 됩니다. 이미 지나본 사람으로서 지금보다 더 긴 거리와, 더 긴 시간을 견뎌야 하는 구간을 조용히 안내합니다.`,
    imageUrl: "https://images.unsplash.com/photo-1440186347098-386b7459ad6b?q=80&w=2070&auto=format&fit=crop", // Balance / Compass concept
    imageAlt: "균형을 잡는 모습",
  },
  {
    id: 4,
    title: "04. 끝까지 걸어갈 수 있는 사람",
    text: `마지막 목표는 분명합니다.
누군가의 손을 잡지 않아도, 누군가의 속도에 맞추지 않아도, 스스로의 판단으로 원하는 방향을 선택하고 끝까지 걸어갈 수 있는 사람으로 성장시키는 것.
ALLROUND가 말하는 교육은 스스로의 기준으로, 자신의 길을 끝까지 걸을 수 있게 만드는 일입니다.`,
    imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2074&auto=format&fit=crop", // Standing alone in nature
    imageAlt: "홀로 서 있는 실루엣",
  },
];

export default function AboutPage() {
  const [activeSection, setActiveSection] = useState<number>(1);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      {/* 
        --- Hero Section --- 
        Full screen video background with centered text.
        z-index hierarchy: Video (0) -> Overlay (1) -> Text (10)
      */}
      <section className="relative h-screen w-full overflow-hidden">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/snow.mp4" type="video/mp4" />
          {/* Fallback image if video fails or loads slowly */}
          <div className="absolute inset-0 bg-neutral-900" />
        </video>

        {/* Dark Overlay for text contrast */}
        <div className="absolute inset-0 bg-black/40 z-[1]" />

        {/* Centered Hero Text */}
        <div className="relative z-10 flex h-full w-full items-center justify-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white"
          >
            ALLROUND
          </motion.h1>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
        >
          <div className="w-[1px] h-16 bg-gradient-to-b from-white to-transparent opacity-50" />
        </motion.div>
      </section>

      {/* 
        --- Main Content Section ---
        Split layout: Left (Images) / Right (Accordion)
      */}
      <section className="relative flex flex-col lg:flex-row min-h-screen bg-[#050505]">
        
        {/* Left: Dynamic Image Area (Sticky on Desktop) */}
        <div className="lg:w-1/2 w-full lg:h-screen lg:sticky lg:top-0 h-[50vh] relative overflow-hidden bg-neutral-900">
          <AnimatePresence mode="wait">
            {sections.map((section) => (
              activeSection === section.id && (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: "easeInOut" }}
                  className="absolute inset-0"
                >
                  <Image
                    src={section.imageUrl}
                    alt={section.imageAlt}
                    fill
                    className="object-cover opacity-60" // Dimmed as requested
                    priority
                  />
                  {/* Additional gradient overlay for better text integration if needed */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-80" />
                </motion.div>
              )
            ))}
          </AnimatePresence>
        </div>

        {/* Right: Accordion Content Area */}
        <div className="lg:w-1/2 w-full flex items-center justify-center p-6 md:p-12 lg:p-24 bg-[#050505] z-10">
          <div className="w-full max-w-2xl space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <h2 className="text-sm font-medium text-neutral-400 tracking-widest mb-4 uppercase">
                Our Philosophy
              </h2>
              <p className="text-3xl md:text-4xl font-bold leading-tight text-neutral-100">
                올라운드가 생각하는<br/>교육의 본질
              </p>
            </motion.div>

            <div className="space-y-0">
              {sections.map((section) => (
                <div 
                  key={section.id} 
                  className="border-b border-neutral-800 last:border-none"
                >
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className="w-full py-8 flex items-center justify-between group text-left focus:outline-none"
                  >
                    <span className={`text-xl md:text-2xl font-bold transition-colors duration-300 ${
                      activeSection === section.id ? "text-white" : "text-neutral-500 group-hover:text-neutral-300"
                    }`}>
                      {section.title}
                    </span>
                    <ChevronDown 
                      className={`w-6 h-6 transition-transform duration-300 ${
                        activeSection === section.id ? "rotate-180 text-white" : "text-neutral-600"
                      }`} 
                    />
                  </button>
                  
                  <AnimatePresence>
                    {activeSection === section.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="pb-8 pt-2">
                          <p className="text-lg text-neutral-300 leading-relaxed whitespace-pre-line font-light">
                            {section.text}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>

      </section>
    </div>
  );
}
