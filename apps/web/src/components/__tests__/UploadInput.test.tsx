import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../test/test-utils';
import React, { useState } from 'react';
import { UploadInput } from '../UploadInput';
import { DropdownContext } from '../CustomDropdown';

// Mock the API module so network calls never happen during tests
vi.mock('../../api', () => ({
  createBatchUpload: vi.fn(),
  uploadToPresignedUrl: vi.fn(),
  getBatchStatus: vi.fn(),
  getBatchDownload: vi.fn(),
}));

// Wrapper that provides the DropdownContext the UploadInput needs internally
function UploadInputWrapper() {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  return (
    <DropdownContext.Provider value={{ openDropdownId, setOpenDropdownId }}>
      <UploadInput />
    </DropdownContext.Provider>
  );
}

function createMockFile(
  name: string,
  sizeBytes: number,
  type: string = 'image/jpeg',
): File {
  const content = new Uint8Array(sizeBytes);
  return new File([content], name, { type });
}

describe('UploadInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Idle state ────────────────────────────────────────────────────────────

  it('renders the drop zone with instructions', () => {
    render(<UploadInputWrapper />);
    expect(screen.getByText(/Drop images here/)).toBeInTheDocument();
    expect(screen.getByText(/browse/)).toBeInTheDocument();
  });

  it('shows accepted formats in help text', () => {
    render(<UploadInputWrapper />);
    expect(screen.getByText(/JPEG, PNG, WebP, GIF/)).toBeInTheDocument();
  });

  it('shows file size limits in help text', () => {
    render(<UploadInputWrapper />);
    expect(screen.getByText(/max 10 MB\/file/)).toBeInTheDocument();
    expect(screen.getByText(/30 MB total/)).toBeInTheDocument();
    expect(screen.getByText(/up to 5 files/)).toBeInTheDocument();
  });

  it('shows "No files selected" when empty', () => {
    render(<UploadInputWrapper />);
    expect(screen.getByText('No files selected')).toBeInTheDocument();
  });

  it('renders the compress button disabled when no files', () => {
    render(<UploadInputWrapper />);
    const btn = screen.getByRole('button', { name: /Compress/i });
    expect(btn).toBeDisabled();
  });

  it('has a hidden file input element', () => {
    render(<UploadInputWrapper />);
    const input = document.getElementById('file-input') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.type).toBe('file');
  });

  // ── Compression settings ──────────────────────────────────────────────────

  it('renders all three settings dropdowns', () => {
    render(<UploadInputWrapper />);
    expect(screen.getByText('Output Format')).toBeInTheDocument();
    expect(screen.getByText('Image Quality')).toBeInTheDocument();
    expect(screen.getByText('Maximum Width')).toBeInTheDocument();
  });

  it('shows default setting values', () => {
    render(<UploadInputWrapper />);
    // Default format is WebP
    expect(screen.getByText('WebP (recommended)')).toBeInTheDocument();
    // Default quality is 80
    expect(screen.getByText('Quality 80 – High quality')).toBeInTheDocument();
    // Default max width is 1920
    expect(screen.getByText('Max 1920 px')).toBeInTheDocument();
  });

  it('renders the settings section label', () => {
    render(<UploadInputWrapper />);
    expect(screen.getByText('Compression Settings')).toBeInTheDocument();
  });

  // ── File selection via input ──────────────────────────────────────────────

  it('adds files when selected via file input', () => {
    render(<UploadInputWrapper />);
    const input = document.getElementById('file-input') as HTMLInputElement;

    const file = createMockFile('photo.jpg', 1024);
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText('photo.jpg')).toBeInTheDocument();
    expect(screen.getByText('1 file selected')).toBeInTheDocument();
  });

  it('shows plural text for multiple files', () => {
    render(<UploadInputWrapper />);
    const input = document.getElementById('file-input') as HTMLInputElement;

    const files = [
      createMockFile('a.jpg', 1024),
      createMockFile('b.png', 2048, 'image/png'),
    ];
    fireEvent.change(input, { target: { files } });

    expect(screen.getByText('2 files selected')).toBeInTheDocument();
  });

  it('enables the compress button after files are added', () => {
    render(<UploadInputWrapper />);
    const input = document.getElementById('file-input') as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [createMockFile('img.jpg', 500)] },
    });

    const btn = screen.getByRole('button', { name: /Compress/i });
    expect(btn).not.toBeDisabled();
  });

  it('shows "+ Add more" button when files are present', () => {
    render(<UploadInputWrapper />);
    const input = document.getElementById('file-input') as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [createMockFile('img.jpg', 500)] },
    });

    expect(screen.getByText('+ Add more')).toBeInTheDocument();
  });

  // ── File removal ──────────────────────────────────────────────────────────

  it('removes a file when the remove button is clicked', () => {
    render(<UploadInputWrapper />);
    const input = document.getElementById('file-input') as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [createMockFile('remove-me.jpg', 500)] },
    });

    expect(screen.getByText('remove-me.jpg')).toBeInTheDocument();

    // The remove button has an X SVG icon — it's the last button in the file row
    const removeButtons = screen.getAllByRole('button').filter((btn) => {
      return btn.querySelector('svg') && btn.closest('.flex.items-center.justify-between');
    });
    // Click the remove button for the file
    if (removeButtons.length > 0) {
      fireEvent.click(removeButtons[0]);
    }

    expect(screen.queryByText('remove-me.jpg')).not.toBeInTheDocument();
  });

  // ── Validation ────────────────────────────────────────────────────────────

  it('rejects files with unsupported types', () => {
    render(<UploadInputWrapper />);
    const input = document.getElementById('file-input') as HTMLInputElement;

    const badFile = createMockFile('doc.pdf', 1024, 'application/pdf');
    fireEvent.change(input, { target: { files: [badFile] } });

    expect(screen.getByText(/unsupported file type/)).toBeInTheDocument();
    expect(screen.getByText('No files selected')).toBeInTheDocument();
  });

  it('rejects files over the single-file size limit', () => {
    render(<UploadInputWrapper />);
    const input = document.getElementById('file-input') as HTMLInputElement;

    // 11 MB > 10 MB limit
    const bigFile = createMockFile('huge.jpg', 11 * 1024 * 1024);
    fireEvent.change(input, { target: { files: [bigFile] } });

    expect(screen.getByText(/single file size must be less than 10 MB/)).toBeInTheDocument();
  });

  it('rejects files beyond the max file count', () => {
    render(<UploadInputWrapper />);
    const input = document.getElementById('file-input') as HTMLInputElement;

    // Try adding 6 files (limit is 5)
    const files = Array.from({ length: 6 }, (_, i) =>
      createMockFile(`img${i}.jpg`, 500),
    );
    fireEvent.change(input, { target: { files } });

    expect(screen.getByText(/maximum 5 files allowed/)).toBeInTheDocument();
  });

  // ── Drop zone interactions ────────────────────────────────────────────────

  it('has a drop zone element', () => {
    render(<UploadInputWrapper />);
    const dropZone = document.getElementById('drop-zone');
    expect(dropZone).toBeInTheDocument();
  });
});
