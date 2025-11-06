-- AddForeignKey
ALTER TABLE `cards` ADD CONSTRAINT `cards_assigneeId_fkey` FOREIGN KEY (`assigneeId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
