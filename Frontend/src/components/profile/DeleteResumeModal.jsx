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
      <ModalTitle className="text-center">Remove resume</ModalTitle>
    </ModalHeader>
    <ModalContent>
      <p className="text-sm text-ink-secondary font-sans leading-relaxed">
        Are you sure you want to remove <span className="font-mono text-ink font-semibold">{filename}</span>? This will permanently remove the resume file from your account.
      </p>
    </ModalContent>
    <ModalFooter>
      <Button
        variant="secondary"
        size="sm"
        onClick={onClose}
        disabled={isDeleting}
      >
        Cancel
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={onConfirm}
        isLoading={isDeleting}
      >
        Remove Resume
      </Button>
    </ModalFooter>
  </Modal>
)

export default DeleteResumeModal
