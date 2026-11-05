import { Modal, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "../shared/Modal"
import Button from "../shared/Button"
import React from "react"

const DeleteResumeModal = ({ isOpen, onClose, onConfirm, isDeleting, filename }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    size="sm"
    closeOnOverlayClick={!isDeleting}
  >
    <ModalHeader className="justify-center text-center">
      <ModalTitle className="text-xl sm:text-2xl font-bold font-display text-center">Remove Resume</ModalTitle>
    </ModalHeader>
    <ModalContent>
      <p className="text-sm sm:text-base text-ink-secondary font-sans leading-relaxed">
        Are you sure you want to remove <span className="font-mono text-ink font-semibold">{filename}</span>? This will permanently remove the resume file from your account.
      </p>
    </ModalContent>
    <ModalFooter>
      <Button
        variant="secondary"
        size="md"
        onClick={onClose}
        disabled={isDeleting}
        className="text-sm sm:text-base px-4 py-2"
      >
        Cancel
      </Button>
      <Button
        variant="destructive"
        size="md"
        onClick={onConfirm}
        isLoading={isDeleting}
        className="text-sm sm:text-base px-4 py-2"
      >
        Remove Resume
      </Button>
    </ModalFooter>
  </Modal>
)

export default DeleteResumeModal
