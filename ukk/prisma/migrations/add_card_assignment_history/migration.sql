-- CreateTable
CREATE TABLE `card_assignments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cardId` INTEGER NOT NULL,
    `assignedTo` INTEGER NOT NULL,
    `assignedBy` INTEGER NOT NULL,
    `projectMemberId` INTEGER NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `unassignedAt` DATETIME(3) NULL,
    `reason` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    INDEX `card_assignments_cardId_isActive_idx`(`cardId`, `isActive`),
    INDEX `card_assignments_assignedTo_isActive_idx`(`assignedTo`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `card_assignments` ADD CONSTRAINT `card_assignments_cardId_fkey` FOREIGN KEY (`cardId`) REFERENCES `cards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `card_assignments` ADD CONSTRAINT `card_assignments_assignedTo_fkey` FOREIGN KEY (`assignedTo`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `card_assignments` ADD CONSTRAINT `card_assignments_assignedBy_fkey` FOREIGN KEY (`assignedBy`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `card_assignments` ADD CONSTRAINT `card_assignments_projectMemberId_fkey` FOREIGN KEY (`projectMemberId`) REFERENCES `project_members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
