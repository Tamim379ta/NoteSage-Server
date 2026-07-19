import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import DocumentModel from "../models/document.model";

const sampleDocs = [
  {
    userId: "6a5a77dd12e05c94f3b7f9d4",
    title: "Cell Biology — Membrane Transport",
    category: "Biology",
    fileType: "application/pdf",
    status: "ready",
    isPublic: true,
    extractedText: "Cell membrane transport includes passive and active transport mechanisms...",
    summary: "• Cell membranes control what enters and exits the cell using transport proteins.\n• Passive transport moves molecules from high to low concentration without energy.\n• Active transport requires ATP to move molecules against their concentration gradient.\n• Osmosis is the diffusion of water across a semipermeable membrane.\n• Endocytosis and exocytosis move large molecules in and out of cells.\n• Channel proteins and carrier proteins facilitate facilitated diffusion.\n• The sodium-potassium pump is a key example of active transport.",
  },
  {
    userId: "6a5a77dd12e05c94f3b7f9d4",
    title: "World War II — Causes & Consequences",
    category: "History",
    fileType: "application/pdf",
    status: "ready",
    isPublic: true,
    extractedText: "World War II began in 1939 and ended in 1945...",
    summary: "• WWII was triggered by Nazi Germany's invasion of Poland in September 1939.\n• The Treaty of Versailles created economic hardship in Germany, fueling extremism.\n• Key Allied powers included the USA, UK, USSR, and France.\n• The Holocaust resulted in the systematic murder of six million Jewish people.\n• The war ended in Europe on May 8, 1945 (VE Day) and in the Pacific on September 2, 1945.\n• The atomic bombs dropped on Hiroshima and Nagasaki accelerated Japan's surrender.\n• The war led to the creation of the United Nations to maintain global peace.",
  },
  {
    userId: "6a5a77dd12e05c94f3b7f9d4",
    title: "Data Structures — Trees & Graphs",
    category: "Computer Science",
    fileType: "application/pdf",
    status: "ready",
    isPublic: true,
    extractedText: "Trees are hierarchical data structures with a root node...",
    summary: "• A tree is a hierarchical data structure with nodes connected by edges.\n• Binary trees have at most two children per node: left and right.\n• BST (Binary Search Tree) maintains sorted order for efficient searching.\n• Graph traversal algorithms include BFS (breadth-first) and DFS (depth-first).\n• AVL trees are self-balancing BSTs that maintain O(log n) operations.\n• Graphs can be directed or undirected and weighted or unweighted.\n• Dijkstra's algorithm finds the shortest path in a weighted graph.",
  },
  {
    userId: "6a5a77dd12e05c94f3b7f9d4",
    title: "Contract Law — Offer & Acceptance",
    category: "Law",
    fileType: "application/pdf",
    status: "ready",
    isPublic: true,
    extractedText: "A contract requires offer, acceptance, and consideration...",
    summary: "• A valid contract requires offer, acceptance, consideration, and intention to be legally bound.\n• An offer must be clear, definite, and communicated to the offeree.\n• Acceptance must be unconditional and mirror the exact terms of the offer.\n• Consideration is something of value exchanged between the parties.\n• A counter-offer terminates the original offer and creates a new one.\n• Contracts can be void, voidable, or unenforceable depending on circumstances.\n• Minors generally lack capacity to enter into binding contracts.",
  },
  {
    userId: "6a5a77dd12e05c94f3b7f9d4",
    title: "Macroeconomics — GDP & Inflation",
    category: "Economics",
    fileType: "application/pdf",
    status: "ready",
    isPublic: true,
    extractedText: "GDP measures the total value of goods and services produced...",
    summary: "• GDP (Gross Domestic Product) measures the total economic output of a country.\n• GDP can be calculated using expenditure, income, or production approaches.\n• Inflation is the rate at which the general price level of goods rises over time.\n• The Consumer Price Index (CPI) is the most common measure of inflation.\n• Hyperinflation occurs when inflation exceeds 50% per month.\n• Central banks use interest rates to control inflation and stimulate growth.\n• Unemployment and inflation are inversely related according to the Phillips Curve.",
  },
  {
    userId: "6a5a77dd12e05c94f3b7f9d4",
    title: "Organic Chemistry — Reaction Mechanisms",
    category: "Chemistry",
    fileType: "application/pdf",
    status: "ready",
    isPublic: true,
    extractedText: "Organic reactions follow specific mechanisms involving electrons...",
    summary: "• SN1 reactions proceed via a carbocation intermediate and follow first-order kinetics.\n• SN2 reactions involve backside attack and are favored with primary substrates.\n• E1 and E2 are elimination reactions that form alkenes from alkyl halides.\n• Nucleophiles are electron-rich species that attack electrophilic carbon centers.\n• Leaving group ability correlates with the stability of the leaving anion.\n• Stereochemistry plays a crucial role — SN2 causes inversion of configuration.\n• Reaction rate in SN1 depends only on substrate concentration, not nucleophile.",
  },
  {
    userId: "6a5a77dd12e05c94f3b7f9d4",
    title: "Quantum Mechanics — Wave Functions",
    category: "Physics",
    fileType: "application/pdf",
    status: "ready",
    isPublic: true,
    extractedText: "Quantum mechanics describes the behavior of particles at atomic scales...",
    summary: "• The wave function ψ describes the quantum state of a particle completely.\n• The square of the wave function |ψ|² gives the probability density of finding a particle.\n• Schrödinger's equation governs how wave functions evolve over time.\n• Heisenberg's uncertainty principle states position and momentum cannot both be precisely known.\n• Wave-particle duality means particles exhibit both wave and particle properties.\n• Quantum superposition allows particles to exist in multiple states simultaneously.\n• Measurement collapses the wave function to a definite state.",
  },
  {
    userId: "6a5a77dd12e05c94f3b7f9d4",
    title: "Linear Algebra — Matrices & Vectors",
    category: "Mathematics",
    fileType: "application/pdf",
    status: "ready",
    isPublic: true,
    extractedText: "Linear algebra deals with vectors, matrices, and linear transformations...",
    summary: "• Vectors are quantities with both magnitude and direction in n-dimensional space.\n• Matrix multiplication is not commutative: AB ≠ BA in general.\n• The determinant of a matrix indicates whether it is invertible (non-zero = invertible).\n• Eigenvalues and eigenvectors describe how a matrix transforms space.\n• The dot product of two vectors measures their similarity and angle between them.\n• Row reduction (Gaussian elimination) solves systems of linear equations.\n• Linear transformations can be represented as matrix-vector multiplication.",
  },
  {
    userId: "6a5a77dd12e05c94f3b7f9d4",
    title: "Genetics — DNA Replication",
    category: "Biology",
    fileType: "application/pdf",
    status: "ready",
    isPublic: true,
    extractedText: "DNA replication is a semiconservative process that copies genetic information...",
    summary: "• DNA replication is semiconservative — each new molecule has one old and one new strand.\n• Helicase unwinds the double helix by breaking hydrogen bonds between base pairs.\n• DNA polymerase adds nucleotides in the 5' to 3' direction only.\n• The leading strand is synthesized continuously; the lagging strand in Okazaki fragments.\n• Primase creates RNA primers to initiate DNA synthesis.\n• DNA ligase joins Okazaki fragments on the lagging strand.\n• Replication occurs at multiple origins simultaneously to speed up the process.",
  },
  {
    userId: "6a5a77dd12e05c94f3b7f9d4",
    title: "Algorithms — Sorting & Searching",
    category: "Computer Science",
    fileType: "application/pdf",
    status: "ready",
    isPublic: true,
    extractedText: "Sorting algorithms arrange data in a specific order...",
    summary: "• Bubble sort repeatedly swaps adjacent elements — O(n²) time complexity.\n• Merge sort uses divide and conquer and runs in O(n log n) guaranteed.\n• Quick sort is fast in practice with average O(n log n) but O(n²) worst case.\n• Binary search finds elements in O(log n) but requires a sorted array.\n• Heap sort uses a binary heap and runs in O(n log n) with O(1) space.\n• Counting sort and radix sort can achieve O(n) for integer data.\n• Choosing the right sorting algorithm depends on data size, type, and memory constraints.",
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string, {
      dbName: "notesage",
    });
    console.log("✅ Connected to MongoDB");

    // Check if already seeded
    const existing = await DocumentModel.countDocuments({ userId: "6a5a77dd12e05c94f3b7f9d4" });
    if (existing > 0) {
      console.log(`⚠️ Already have ${existing} documents — skipping seed`);
      process.exit(0);
    }

    await DocumentModel.insertMany(sampleDocs);
    console.log("✅ 10 sample documents inserted successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

seed();