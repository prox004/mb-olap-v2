"use client";
import React, { useState } from "react";
import FaqOne from "./FaqOne";

const accordionData = [
  {
    title: "Do I get free updates?",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec quis magna ac nibh malesuada consectetur at vitae ipsum orem ipsum dolor sit amet, consectetur adipiscing elit nam fermentum, leo et lacinia accumsan.",
  },
  {
    title: "Do I get free updates?",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec quis magna ac nibh malesuada consectetur at vitae ipsum orem ipsum dolor sit amet, consectetur adipiscing elit nam fermentum, leo et lacinia accumsan.",
  },
  {
    title: "Can I Customize TailAdmin to suit my needs?",
    content:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec quis magna ac nibh malesuada consectetur at vitae ipsum orem ipsum dolor sit amet, consectetur adipiscing elit nam fermentum, leo et lacinia accumsan.",
  },
  {
    title: "What does Unlimited Projects mean?",
    content:
      "We have a 30-day refund policy. If you are not satisfied with the product, you can request a full refund within the first 30 days.",
  },
];

export default function FaqsOneExample() {
  // State to track the currently open accordion
  const [openIndex, setOpenIndex] = useState<number | null>(0); // Initially open the first accordion

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index); // Close if open, otherwise open the clicked one
  };
  return (
    <div className="space-y-4">
      {accordionData.map((item, index) => (
        <FaqOne
          key={index}
          title={item.title}
          content={item.content}
          isOpen={openIndex === index} // Check if this accordion should be open
          toggleAccordion={() => handleToggle(index)} // Pass toggle function
        />
      ))}
    </div>
  );
}
