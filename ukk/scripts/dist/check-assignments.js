"use strict";
/**
 * Check current state of card assignments
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function checkAssignments() {
    return __awaiter(this, void 0, void 0, function () {
        var activeAssignments, userAssignments, cards, _i, cards_1, card, activeAssignment;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("📊 Current CardAssignment State:\n");
                    return [4 /*yield*/, prisma.cardAssignment.findMany({
                            where: { isActive: true },
                            include: {
                                card: {
                                    select: {
                                        id: true,
                                        title: true,
                                        status: true,
                                    },
                                },
                                assignee: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                                assigner: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                            orderBy: {
                                assignedAt: "desc",
                            },
                        })];
                case 1:
                    activeAssignments = _a.sent();
                    console.log("Total active assignments: ".concat(activeAssignments.length, "\n"));
                    userAssignments = new Map();
                    activeAssignments.forEach(function (assignment) {
                        var userId = assignment.assignedTo;
                        if (!userAssignments.has(userId)) {
                            userAssignments.set(userId, []);
                        }
                        userAssignments.get(userId).push(assignment);
                    });
                    console.log("═══════════════════════════════════════════════\n");
                    userAssignments.forEach(function (assignments, userId) {
                        var user = assignments[0].assignee;
                        var unfinishedTasks = assignments.filter(function (a) { return a.card.status !== "DONE"; });
                        console.log("\uD83D\uDC64 User: ".concat(user.name, " (ID: ").concat(user.id, ")"));
                        console.log("   Email: ".concat(user.email));
                        console.log("   Total assignments: ".concat(assignments.length, " (").concat(unfinishedTasks.length, " unfinished)\n"));
                        assignments.forEach(function (assignment, index) {
                            var statusIcon = assignment.card.status === "DONE" ? "✅" : "⏳";
                            console.log("   ".concat(index + 1, ". ").concat(statusIcon, " [").concat(assignment.card.status, "] Card #").concat(assignment.card.id, ": \"").concat(assignment.card.title, "\""));
                            console.log("      Assigned by: ".concat(assignment.assigner.name, " at ").concat(assignment.assignedAt.toLocaleString()));
                            console.log("      Reason: ".concat(assignment.reason || "(no reason provided)"));
                        });
                        if (unfinishedTasks.length > 1) {
                            console.log("   \n   \u26A0\uFE0F  WARNING: User has ".concat(unfinishedTasks.length, " unfinished tasks!"));
                        }
                        console.log("\n═══════════════════════════════════════════════\n");
                    });
                    // Check card status consistency
                    console.log("🔍 Checking Card.assigneeId consistency...\n");
                    return [4 /*yield*/, prisma.card.findMany({
                            where: {
                                assigneeId: { not: null },
                            },
                            select: {
                                id: true,
                                title: true,
                                assigneeId: true,
                                status: true,
                            },
                        })];
                case 2:
                    cards = _a.sent();
                    _i = 0, cards_1 = cards;
                    _a.label = 3;
                case 3:
                    if (!(_i < cards_1.length)) return [3 /*break*/, 6];
                    card = cards_1[_i];
                    return [4 /*yield*/, prisma.cardAssignment.findFirst({
                            where: {
                                cardId: card.id,
                                isActive: true,
                            },
                        })];
                case 4:
                    activeAssignment = _a.sent();
                    if (!activeAssignment) {
                        console.log("\u26A0\uFE0F  Card #".concat(card.id, " has assigneeId=").concat(card.assigneeId, " but NO active assignment!"));
                    }
                    else if (activeAssignment.assignedTo !== card.assigneeId) {
                        console.log("\u26A0\uFE0F  Card #".concat(card.id, " assigneeId mismatch: Card=").concat(card.assigneeId, ", Assignment=").concat(activeAssignment.assignedTo));
                    }
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6:
                    console.log("\n✅ Consistency check complete!");
                    return [2 /*return*/];
            }
        });
    });
}
checkAssignments()
    .then(function () {
    process.exit(0);
})
    .catch(function (error) {
    console.error("❌ Error:", error);
    process.exit(1);
})
    .finally(function () {
    prisma.$disconnect();
});
