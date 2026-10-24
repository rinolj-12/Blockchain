import { deployment } from "./deployment.js";

/**
 * Question Paper Data with plaintext question previews,
 * metadata, and IPFS / Keccak cryptographic parameters.
 */
export const CANDIDATE_PAPERS = [
  {
    id: "A",
    title: "Data Structures & Algorithms (CS501)",
    setName: "Set A — Algorithmic Foundations",
    duration: "3 Hours",
    maxMarks: 100,
    questions: [
      {
        no: "Q1",
        marks: 20,
        topic: "Arrays & Linked Lists",
        text: "Compare dynamic array and singly linked list for front/end insertion and random access. Write in-place reversal algorithm using O(1) extra memory.",
      },
      {
        no: "Q2",
        marks: 20,
        topic: "Stacks & Amortized Complexity",
        text: "Implement a queue using two stacks and prove amortized cost is O(1). Convert infix (A + B) * C - D / E to postfix showing intermediate states.",
      },
      {
        no: "Q3",
        marks: 20,
        topic: "Binary Search Trees",
        text: "Insert keys [50, 30, 70, 20, 40, 60, 80, 35] into BST. Produce inorder, preorder, postorder traversals and analyze node deletion cases.",
      },
      {
        no: "Q4",
        marks: 20,
        topic: "Hash Tables & Probing",
        text: "Insert keys [23, 43, 13, 27, 37] into size-10 table with linear probing. Explain load factor thresholds and collision resolution.",
      },
      {
        no: "Q5",
        marks: 20,
        topic: "Graph Algorithms",
        text: "Explain BFS with adjacency list time complexity. Trace Dijkstra's single-source shortest path algorithm from vertex S.",
      },
    ],
    encryption: "AES-256-GCM authenticated cipher",
    threshold: "3-of-5 Shamir Secret Shares",
    cid: deployment?.preparedPapers?.[0]?.cid || "bafkreihdworlng5ep7l6u7hqtobzi6inqkumsfwwkgzrizzcq2bsdx6pmy",
    hash: deployment?.preparedPapers?.[0]?.hash || "0x0005348256b2827e70d047471946d84b2c93b46f87f5c3a3ab919a0783800a5a",
    size: deployment?.preparedPapers?.[0]?.size || 1712,
  },
  {
    id: "B",
    title: "Data Structures & Algorithms (CS501)",
    setName: "Set B — Sorting & Advanced Trees",
    duration: "3 Hours",
    maxMarks: 100,
    questions: [
      {
        no: "Q1",
        marks: 20,
        topic: "Asymptotic Complexity",
        text: "Define Big-O, Big-Omega, Big-Theta notation. Solve recurrence T(n) = 2T(n/2) + n via Master Theorem.",
      },
      {
        no: "Q2",
        marks: 20,
        topic: "Quicksort & Stability",
        text: "Trace Quicksort on [9, 4, 7, 1, 8, 2, 6] with last element pivot. Analyze O(n²) worst case and stability among merge sort and heap sort.",
      },
      {
        no: "Q3",
        marks: 20,
        topic: "Heaps & Priority Queues",
        text: "Build max-heap from [3, 9, 2, 1, 4, 5] using bottom-up sift-down. Detail binary heap insert and extract-max operations.",
      },
      {
        no: "Q4",
        marks: 20,
        topic: "Balanced Trees (AVL)",
        text: "Insert [10, 20, 30, 40, 50, 25] into empty AVL tree detailing single and double rotations. Contrast AVL vs Red-Black balancing factors.",
      },
      {
        no: "Q5",
        marks: 20,
        topic: "Hashing & Probing",
        text: "Compare quadratic probing and double hashing. Analyze clustering phenomena in secondary hash buckets.",
      },
    ],
    encryption: "AES-256-GCM authenticated cipher",
    threshold: "3-of-5 Shamir Secret Shares",
    cid: deployment?.preparedPapers?.[1]?.cid || "bafkreie3vahxtryuv2x4nhjvgnq5rdo4l43cokidzruzg23zzaxp7tftna",
    hash: deployment?.preparedPapers?.[1]?.hash || "0xd2a248e28c52fe5f03e200223ac3f046f5e17be93ffcb376a1debc9022832f7a",
    size: deployment?.preparedPapers?.[1]?.size || 1520,
  },
  {
    id: "C",
    title: "Data Structures & Algorithms (CS501)",
    setName: "Set C — Dynamic Programming & Tries",
    duration: "3 Hours",
    maxMarks: 100,
    questions: [
      {
        no: "Q1",
        marks: 20,
        topic: "Linked Structures",
        text: "Explain O(1) node deletion in doubly linked lists. Implement Floyd's cycle-finding (tortoise and hare) loop detection algorithm.",
      },
      {
        no: "Q2",
        marks: 20,
        topic: "Search Optimization",
        text: "Write iterative binary search and derive logarithmic O(log n) bound. Compare 1M word lookup in hash tables vs binary search.",
      },
      {
        no: "Q3",
        marks: 20,
        topic: "Tries & String Indexing",
        text: "Insert ['tea', 'ten', 'to', 'inn', 'in'] into trie. Detail prefix search complexity and space trade-offs compared to hashing.",
      },
      {
        no: "Q4",
        marks: 20,
        topic: "Dynamic Programming",
        text: "Explain optimal substructure and overlapping subproblems. Fill DP memoization matrix for Longest Common Subsequence of 'ABCBDAB' and 'BDCABA'.",
      },
      {
        no: "Q5",
        marks: 20,
        topic: "Minimum Spanning Trees",
        text: "Execute Kruskal's algorithm using disjoint-set union-find. Trace cycle prevention via path compression.",
      },
    ],
    encryption: "AES-256-GCM authenticated cipher",
    threshold: "3-of-5 Shamir Secret Shares",
    cid: deployment?.preparedPapers?.[2]?.cid || "bafkreidhxnlvqgssw3chx5epap4a2ybpuxtdwdhzzz7o7nrxrphnw44lmy",
    hash: deployment?.preparedPapers?.[2]?.hash || "0xfe8e11e7fdf78bd2fa42313b22e736868ab6e5e813b8e174874d610819c9f183",
    size: deployment?.preparedPapers?.[2]?.size || 1470,
  },
];
