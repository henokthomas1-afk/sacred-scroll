/**
 * Sample documents for demonstration
 */

import { ParsedDocument, DocumentNode } from "@/types/document";

/**
 * Sample: Catechism of the Catholic Church excerpt
 */
export const sampleCatechism: ParsedDocument = {
  metadata: {
    id: "ccc-sample",
    title: "Catechism of the Catholic Church",
    sourceType: "catechism",
    importedAt: new Date(),
    totalCitableNodes: 10,
  },
  nodes: [
    {
      nodeType: "structural",
      id: "s1",
      level: "part",
      content: "PART ONE: THE PROFESSION OF FAITH",
      alignment: "center",
    },
    {
      nodeType: "structural",
      id: "s2",
      level: "section",
      content: "SECTION ONE: \"I BELIEVE\" - \"WE BELIEVE\"",
      alignment: "center",
    },
    {
      nodeType: "structural",
      id: "s3",
      level: "chapter",
      content: "CHAPTER ONE: MAN'S CAPACITY FOR GOD",
      alignment: "center",
    },
    {
      nodeType: "structural",
      id: "s4",
      level: "roman",
      content: "I. The Desire for God",
      alignment: "left",
    },
    {
      nodeType: "citable",
      id: "c1",
      number: 27,
      displayNumber: "27",
      content: "The desire for God is written in the human heart, because man is created by God and for God; and God never ceases to draw man to himself. Only in God will he find the truth and happiness he never stops searching for.",
    },
    {
      nodeType: "citable",
      id: "c2",
      number: 28,
      displayNumber: "28",
      content: "In many ways, throughout history down to the present day, men have given expression to their quest for God in their religious beliefs and behavior: in their prayers, sacrifices, rituals, meditations, and so forth. These forms of religious expression, despite the ambiguities they often bring with them, are so universal that one may well call man a religious being.",
    },
    {
      nodeType: "citable",
      id: "c3",
      number: 29,
      displayNumber: "29",
      content: "But this \"intimate and vital bond of man to God\" can be forgotten, overlooked, or even explicitly rejected by man. Such attitudes can have different causes: revolt against evil in the world; religious ignorance or indifference; the cares and riches of this world; the scandal of bad example on the part of believers; currents of thought hostile to religion; finally, that attitude of sinful man which makes him hide from God out of fear and flee his call.",
    },
    {
      nodeType: "structural",
      id: "s5",
      level: "roman",
      content: "II. Ways of Coming to Know God",
      alignment: "left",
    },
    {
      nodeType: "citable",
      id: "c4",
      number: 31,
      displayNumber: "31",
      content: "Created in God's image and called to know and love him, the person who seeks God discovers certain ways of coming to know him. These are also called proofs for the existence of God, not in the sense of proofs in the natural sciences, but rather in the sense of \"converging and convincing arguments\", which allow us to attain certainty about the truth.",
    },
    {
      nodeType: "citable",
      id: "c5",
      number: 32,
      displayNumber: "32",
      content: "The world: starting from movement, becoming, contingency, and the world's order and beauty, one can come to a knowledge of God as the origin and the end of the universe.",
    },
    {
      nodeType: "citable",
      id: "c6",
      number: 33,
      displayNumber: "33",
      content: "The human person: with his openness to truth and beauty, his sense of moral goodness, his freedom and the voice of his conscience, with his longings for the infinite and for happiness, man questions himself about God's existence. In all this he discerns signs of his spiritual soul.",
    },
    {
      nodeType: "structural",
      id: "s6",
      level: "brief",
      content: "IN BRIEF",
      alignment: "left",
    },
    {
      nodeType: "citable",
      id: "c7",
      number: 44,
      displayNumber: "44",
      content: "Man is by nature and vocation a religious being. Coming from God, going toward God, man lives a fully human life only if he freely lives by his bond with God.",
    },
    {
      nodeType: "citable",
      id: "c8",
      number: 45,
      displayNumber: "45",
      content: "Man is made to live in communion with God in whom he finds his happiness: \"When I am completely united to you, there will be no more sorrow or trials; entirely full of you, my life will be complete\" (St. Augustine).",
    },
  ] as DocumentNode[],
};

/**
 * Sample: Epistle of Polycarp to the Philippians
 */
export const samplePolycarp: ParsedDocument = {
  metadata: {
    id: "polycarp-philippians",
    title: "The Epistle of Polycarp to the Philippians",
    author: "St. Polycarp of Smyrna",
    sourceType: "patristic",
    importedAt: new Date(),
    totalCitableNodes: 8,
  },
  nodes: [
    {
      nodeType: "structural",
      id: "ps1",
      level: "book",
      content: "THE EPISTLE OF POLYCARP TO THE PHILIPPIANS",
      alignment: "center",
    },
    {
      nodeType: "structural",
      id: "ps2",
      level: "preface",
      content: "GREETING",
      alignment: "left",
    },
    {
      nodeType: "citable",
      id: "pc1",
      number: 1,
      displayNumber: "1",
      content: "Polycarp, and the presbyters with him, to the Church of God sojourning at Philippi: Mercy to you, and peace from God Almighty, and from the Lord Jesus Christ, our Saviour, be multiplied.",
    },
    {
      nodeType: "structural",
      id: "ps3",
      level: "chapter",
      content: "Chapter I.—Praise of the Philippians",
      alignment: "center",
    },
    {
      nodeType: "citable",
      id: "pc2",
      number: 2,
      displayNumber: "2",
      content: "I have greatly rejoiced with you in our Lord Jesus Christ, because ye have followed the example of true love [as displayed by God], and have accompanied, as became you, those who were bound in chains, the fitting ornaments of saints, and which are indeed the diadems of the true elect of God and our Lord.",
    },
    {
      nodeType: "citable",
      id: "pc3",
      number: 3,
      displayNumber: "3",
      content: "And because the strong root of your faith, spoken of in days long gone by, endureth even until now, and bringeth forth fruit to our Lord Jesus Christ, who for our sins suffered even unto death, [but] \"whom God raised from the dead, having loosed the bands of the grave.\"",
    },
    {
      nodeType: "structural",
      id: "ps4",
      level: "chapter",
      content: "Chapter II.—An Exhortation to Virtue",
      alignment: "center",
    },
    {
      nodeType: "citable",
      id: "pc4",
      number: 4,
      displayNumber: "4",
      content: "\"Wherefore, girding up your loins,\" \"serve the Lord in fear\" and truth, as those who have forsaken the vain, empty talk and error of the multitude, and \"believed in Him who raised up our Lord Jesus Christ from the dead, and gave Him glory,\" and a throne at His right hand.",
    },
    {
      nodeType: "citable",
      id: "pc5",
      number: 5,
      displayNumber: "5",
      content: "To Him all things in heaven and on earth are subject. Him every spirit serves. He comes as the Judge of the living and the dead. His blood will God require of those who do not believe in Him.",
    },
    {
      nodeType: "structural",
      id: "ps5",
      level: "chapter",
      content: "Chapter III.—Expressions of Personal Unworthiness",
      alignment: "center",
    },
    {
      nodeType: "citable",
      id: "pc6",
      number: 6,
      displayNumber: "6",
      content: "But He who raised Him up from the dead will raise up us also, if we do His will, and walk in His commandments, and love what He loved, keeping ourselves from all unrighteousness, covetousness, love of money, evil speaking, false witness.",
    },
    {
      nodeType: "citable",
      id: "pc7",
      number: 7,
      displayNumber: "7",
      content: "\"Not rendering evil for evil, or railing for railing,\" or blow for blow, or cursing for cursing, but being mindful of what the Lord said in His teaching.",
    },
    {
      nodeType: "citable",
      id: "pc8",
      number: 8,
      displayNumber: "8",
      content: "\"Judge not, that ye be not judged; forgive, and it shall be forgiven unto you; be merciful, that ye may obtain mercy; with what measure ye mete, it shall be measured to you again.\"",
    },
  ] as DocumentNode[],
};

/**
 * All sample documents
 */
export const sampleDocuments: ParsedDocument[] = [
  sampleCatechism,
  samplePolycarp,
];
