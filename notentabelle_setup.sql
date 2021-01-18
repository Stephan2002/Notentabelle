-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Erstellungszeit: 16. Jan 2021 um 12:02
-- Server-Version: 10.4.13-MariaDB
-- PHP-Version: 7.4.7

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Datenbank: `notentabelle`
--
CREATE DATABASE IF NOT EXISTS `notentabelle` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE `notentabelle`;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `classes`
--

CREATE TABLE `classes` (
  `classID` int(11) NOT NULL,
  `userID` int(11) NOT NULL,
  `isHidden` tinyint(1) NOT NULL DEFAULT 0,
  `name` varchar(63) NOT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `referenceID` int(11) DEFAULT NULL,
  `deleteTimestamp` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `marks`
--

CREATE TABLE `marks` (
  `testID` int(11) NOT NULL,
  `studentID` int(11) DEFAULT NULL,
  `mark` decimal(8,6) DEFAULT NULL,
  `points` decimal(7,3) DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `permissions`
--

CREATE TABLE `permissions` (
  `userID` int(11) NOT NULL,
  `semesterID` int(11) DEFAULT NULL,
  `classID` int(11) DEFAULT NULL,
  `testID` int(11) DEFAULT NULL,
  `writingPermission` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `publictemplates`
--

CREATE TABLE `publictemplates` (
  `semesterID` int(11) NOT NULL,
  `userID` int(11) NOT NULL,
  `type` enum('semesterTemplate','subjectTemplate') NOT NULL,
  `name` varchar(63) NOT NULL,
  `school` varchar(63) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `semesters`
--

CREATE TABLE `semesters` (
  `semesterID` int(11) NOT NULL,
  `userID` int(11) NOT NULL,
  `classID` int(11) DEFAULT NULL,
  `parentID` int(11) DEFAULT NULL,
  `isFolder` tinyint(1) NOT NULL DEFAULT 0,
  `isHidden` tinyint(1) NOT NULL DEFAULT 0,
  `templateType` enum('semesterTemplate','subjectTemplate') DEFAULT NULL,
  `name` varchar(63) NOT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `referenceID` int(11) DEFAULT NULL,
  `referenceTestID` int(11) DEFAULT NULL,
  `deleteTimestamp` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `students`
--

CREATE TABLE `students` (
  `studentID` int(11) NOT NULL,
  `classID` int(11) NOT NULL,
  `isHidden` tinyint(1) NOT NULL DEFAULT 0,
  `userID` int(11) DEFAULT NULL,
  `firstName` varchar(63) DEFAULT NULL,
  `lastName` varchar(63) NOT NULL,
  `gender` enum('m','f','d') DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `deleteTimestamp` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `tests`
--

CREATE TABLE `tests` (
  `testID` int(11) NOT NULL,
  `semesterID` int(11) NOT NULL,
  `parentID` int(11) DEFAULT NULL,
  `subjectID` int(11) DEFAULT NULL,
  `isFolder` tinyint(1) NOT NULL DEFAULT 0,
  `isHidden` tinyint(1) NOT NULL DEFAULT 0,
  `name` varchar(63) NOT NULL,
  `date` date DEFAULT NULL,
  `weight` decimal(7,3) DEFAULT NULL,
  `maxPoints` decimal(7,3) DEFAULT NULL,
  `formula` enum('linear','manual') DEFAULT NULL,
  `markCounts` tinyint(1) NOT NULL DEFAULT 0,
  `round` decimal(7,3) DEFAULT 0.000,
  `notes` varchar(255) DEFAULT NULL,
  `referenceID` int(11) DEFAULT NULL,
  `referenceState` enum('ok','template','deleted','forbidden','outdated','delTemp','delForbidden') DEFAULT NULL,
  `isReferenced` tinyint(1) NOT NULL DEFAULT 0,
  `deleteTimestamp` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `users`
--

CREATE TABLE `users` (
  `userID` int(11) NOT NULL,
  `userName` varchar(63) NOT NULL,
  `eMail` varchar(63) NOT NULL,
  `password` varchar(255) NOT NULL,
  `status` enum('normal','blocked','demo','admin') NOT NULL DEFAULT 'normal',
  `isTeacher` tinyint(1) NOT NULL DEFAULT 0,
  `isVerified` tinyint(1) NOT NULL DEFAULT 0,
  `firstName` varchar(63) DEFAULT NULL,
  `lastName` varchar(63) DEFAULT NULL,
  `gender` enum('m','f','d') DEFAULT NULL,
  `school` varchar(63) DEFAULT NULL,
  `verificationToken` char(64) DEFAULT NULL,
  `newEmail` varchar(63) DEFAULT NULL,
  `lowerDisplayBound` decimal(8,6) NOT NULL DEFAULT 4.000000,
  `upperDisplayBound` decimal(8,6) NOT NULL DEFAULT 5.000000,
  `lastUsed` date NOT NULL DEFAULT current_timestamp(),
  `deleteTimestamp` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`classID`),
  ADD KEY `userID` (`userID`),
  ADD KEY `referenceID` (`referenceID`);

--
-- Indizes für die Tabelle `marks`
--
ALTER TABLE `marks`
  ADD KEY `studentID` (`studentID`),
  ADD KEY `testID` (`testID`);

--
-- Indizes für die Tabelle `permissions`
--
ALTER TABLE `permissions`
  ADD KEY `userID` (`userID`),
  ADD KEY `classID` (`classID`),
  ADD KEY `semesterID` (`semesterID`),
  ADD KEY `testID` (`testID`);

--
-- Indizes für die Tabelle `publictemplates`
--
ALTER TABLE `publictemplates`
  ADD KEY `userID` (`userID`);

--
-- Indizes für die Tabelle `semesters`
--
ALTER TABLE `semesters`
  ADD PRIMARY KEY (`semesterID`),
  ADD KEY `userID` (`userID`),
  ADD KEY `parentID` (`parentID`),
  ADD KEY `classID` (`classID`),
  ADD KEY `referenceID` (`referenceID`),
  ADD KEY `referenceTestID` (`referenceTestID`);

--
-- Indizes für die Tabelle `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`studentID`),
  ADD KEY `classID` (`classID`),
  ADD KEY `userID` (`userID`);

--
-- Indizes für die Tabelle `tests`
--
ALTER TABLE `tests`
  ADD PRIMARY KEY (`testID`),
  ADD KEY `parentID` (`parentID`),
  ADD KEY `semesterID` (`semesterID`),
  ADD KEY `subjectID` (`subjectID`),
  ADD KEY `referenceID` (`referenceID`);

--
-- Indizes für die Tabelle `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`userID`),
  ADD UNIQUE KEY `userName` (`userName`),
  ADD UNIQUE KEY `eMail` (`eMail`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `classes`
--
ALTER TABLE `classes`
  MODIFY `classID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `semesters`
--
ALTER TABLE `semesters`
  MODIFY `semesterID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `students`
--
ALTER TABLE `students`
  MODIFY `studentID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `tests`
--
ALTER TABLE `tests`
  MODIFY `testID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `users`
--
ALTER TABLE `users`
  MODIFY `userID` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `classes`
--
ALTER TABLE `classes`
  ADD CONSTRAINT `classes_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `users` (`userID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `marks`
--
ALTER TABLE `marks`
  ADD CONSTRAINT `marks_ibfk_1` FOREIGN KEY (`studentID`) REFERENCES `students` (`studentID`) ON DELETE CASCADE,
  ADD CONSTRAINT `marks_ibfk_2` FOREIGN KEY (`testID`) REFERENCES `tests` (`testID`) ON DELETE CASCADE;

--
-- Constraints der Tabelle `permissions`
--
ALTER TABLE `permissions`
  ADD CONSTRAINT `permissions_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `users` (`userID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `permissions_ibfk_2` FOREIGN KEY (`classID`) REFERENCES `classes` (`classID`) ON DELETE CASCADE,
  ADD CONSTRAINT `permissions_ibfk_3` FOREIGN KEY (`semesterID`) REFERENCES `semesters` (`semesterID`) ON DELETE CASCADE,
  ADD CONSTRAINT `permissions_ibfk_4` FOREIGN KEY (`testID`) REFERENCES `tests` (`testID`) ON DELETE CASCADE;

--
-- Constraints der Tabelle `publictemplates`
--
ALTER TABLE `publictemplates`
  ADD CONSTRAINT `publictemplates_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `users` (`userID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints der Tabelle `semesters`
--
ALTER TABLE `semesters`
  ADD CONSTRAINT `semesters_ibfk_1` FOREIGN KEY (`userID`) REFERENCES `users` (`userID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `semesters_ibfk_2` FOREIGN KEY (`parentID`) REFERENCES `semesters` (`semesterID`) ON DELETE CASCADE;

--
-- Constraints der Tabelle `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `students_ibfk_1` FOREIGN KEY (`classID`) REFERENCES `classes` (`classID`) ON DELETE CASCADE,
  ADD CONSTRAINT `students_ibfk_2` FOREIGN KEY (`userID`) REFERENCES `users` (`userID`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints der Tabelle `tests`
--
ALTER TABLE `tests`
  ADD CONSTRAINT `tests_ibfk_1` FOREIGN KEY (`parentID`) REFERENCES `tests` (`testID`) ON DELETE CASCADE,
  ADD CONSTRAINT `tests_ibfk_2` FOREIGN KEY (`semesterID`) REFERENCES `semesters` (`semesterID`) ON DELETE CASCADE,
  ADD CONSTRAINT `tests_ibfk_3` FOREIGN KEY (`subjectID`) REFERENCES `tests` (`testID`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
